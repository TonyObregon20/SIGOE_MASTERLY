import { createHash, randomInt } from "node:crypto";

export class SaleError extends Error {
  constructor(message, status = 400, field = "") {
    super(message);
    this.status = status;
    this.field = field;
  }
}

export const PAYMENT_METHODS = ["Efectivo", "Tarjeta", "Yape", "Plin", "Transferencia"];
const SIZES = ["S", "M", "L", "XL"];
const text = (value, max = 160) => typeof value === "string" ? value.trim().slice(0, max) : "";
const reject = (message, status, field) => { throw new SaleError(message, status, field); };
export const limaDate = (date = new Date()) => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Lima" }).format(date);

export function validateInPersonSale(input, now = new Date()) {
  if (!input || typeof input !== "object") reject("La venta no es válida.");
  const requestId = text(input.requestId, 40);
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(requestId)) reject("Vuelve a abrir el formulario para registrar la venta.");
  const date = text(input.date, 10);
  const parsed = new Date(`${date}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || date > limaDate(now) || date < "2000-01-01") {
    reject("Ingresa una fecha válida que no sea futura.", 400, "date");
  }
  const customerName = text(input.customerName);
  if (customerName.length < 3) reject("Ingresa el nombre completo o razón social del cliente.", 400, "customerName");
  const docType = input.docType;
  if (!["Boleta", "Factura"].includes(docType)) reject("Selecciona Boleta o Factura.", 400, "docType");
  const customerDocument = text(input.customerDocument, 20);
  if (!(docType === "Factura" ? /^\d{11}$/ : /^\d{8}$/).test(customerDocument)) reject(docType === "Factura" ? "Ingresa un RUC de 11 dígitos." : "Ingresa un DNI de 8 dígitos.", 400, "customerDocument");
  const customerEmail = text(input.customerEmail, 254).toLowerCase();
  if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) reject("El correo electrónico no es válido.", 400, "customerEmail");
  const customerPhone = text(input.customerPhone, 30);
  if (customerPhone && !/^[+\d\s()-]{6,30}$/.test(customerPhone)) reject("El teléfono no es válido.", 400, "customerPhone");
  const customerAddress = text(input.customerAddress, 300);
  if (docType === "Factura" && !customerAddress) reject("Ingresa la dirección fiscal para la factura.", 400, "customerAddress");
  if (!PAYMENT_METHODS.includes(input.paymentMethod)) reject("Selecciona un medio de pago.", 400, "paymentMethod");
  if (!Array.isArray(input.items) || !input.items.length || input.items.length > 100) reject("Agrega entre 1 y 100 prendas a la venta.", 400, "items");
  const grouped = new Map();
  for (const item of input.items) {
    const productId = text(item?.productId, 100);
    const quantity = Number(item?.quantity);
    const selectedSize = item?.selectedSize;
    if (!productId || !SIZES.includes(selectedSize) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000) reject("Revisa el producto, talla y cantidad de cada prenda.", 400, "items");
    const key = `${productId}:${selectedSize}`;
    const aggregate = (grouped.get(key)?.quantity || 0) + quantity;
    if (aggregate > 1000) reject("La cantidad por producto y talla no puede superar 1000 unidades.", 400, "items");
    grouped.set(key, { productId, selectedSize, quantity: aggregate });
  }
  return {
    requestId: requestId.toLowerCase(), date, customerName, customerDocument, customerEmail,
    customerPhone, customerAddress, customerId: text(input.customerId, 100), docType,
    paymentMethod: input.paymentMethod, paymentReference: text(input.paymentReference),
    notes: text(input.notes, 500), items: [...grouped.values()].sort((a, b) => `${a.productId}:${a.selectedSize}`.localeCompare(`${b.productId}:${b.selectedSize}`))
  };
}

// The caller supplies a transaction and models; tests never need a MongoDB connection.
export function createInPersonSaleService({ Order, Product, Invoice, Movement, Kardex, User, transaction, now = () => new Date() }) {
  return async ({ input, actor }) => {
    if (actor?.role !== "admin") reject("Solo el administrador puede registrar ventas presenciales.", 403);
    const createdAt = now();
    const data = validateInPersonSale(input, createdAt);
    const id = `ORD-POS-${data.requestId}`;
    const fingerprint = createHash("sha256").update(JSON.stringify(data)).digest("hex");
    const replay = async (existing, session) => {
      if (existing.channel !== "presencial" || existing.requestFingerprint !== fingerprint) reject("Esta solicitud ya registró otra venta. Cierra el formulario para iniciar una nueva.", 409);
      const invoice = await Invoice.findOne({ orderId: id }).session(session).lean();
      const movement = await Movement.findOne({ orderId: id, type: "Salida" }).session(session).lean();
      return { order: existing, invoice, movement, replayed: true };
    };
    try {
      return await transaction(async session => {
        const existing = await Order.findOne({ id }).session(session).lean();
        if (existing) return replay(existing, session);
        if (data.customerId) {
          const customer = await User.findOne({ id: data.customerId, role: "customer" }).session(session).lean();
          if (!customer) reject("El cliente seleccionado ya no está disponible.", 400, "customerId");
        }
        const products = await Product.find({ id: { $in: data.items.map(item => item.productId) } }).session(session).lean();
        const byId = new Map(products.map(product => [product.id, product]));
        const totals = new Map();
        let cents = 0;
        const items = data.items.map(item => {
          const product = byId.get(item.productId);
          if (!product) reject("Una de las prendas ya no está disponible.", 409, "items");
          const price = Number(product.price);
          if (!Number.isFinite(price) || price < 0) reject(`Revisa el precio de ${product.name}.`, 409, "items");
          const size = product.sizes?.[item.selectedSize];
          if (size == null) reject(`Configura el stock real de la talla ${item.selectedSize} de ${product.name} en Almacén.`, 409, "items");
          const physical = Number(typeof size === "number" ? size : size.stockPhysical) || 0;
          const committed = Number(typeof size === "object" ? size.stockCommitted : 0) || 0;
          if (physical - committed < item.quantity) reject(`Stock insuficiente: ${product.name}, talla ${item.selectedSize}.`, 409, "items");
          totals.set(product.id, (totals.get(product.id) || 0) + item.quantity);
          const unitCents = Math.round(price * 100);
          cents += unitCents * item.quantity;
          return { ...item, productName: product.name, price: unitCents / 100 };
        });
        if (!Number.isSafeInteger(cents) || cents <= 0) reject("El total de la venta no es válido.", 400, "items");
        for (const [productId, quantity] of totals) {
          const product = byId.get(productId);
          if ((Number(product.stockPhysical) || 0) - (Number(product.stockCommitted) || 0) < quantity) reject(`Stock disponible insuficiente para ${product.name}.`, 409, "items");
        }
        const total = cents / 100;
        const movementId = `S-POS-${data.requestId}`;
        const order = {
          id, ...(data.customerId ? { userId: data.customerId } : {}),
          customerName: data.customerName, customerEmail: data.customerEmail,
          customerDocument: data.customerDocument, customerPhone: data.customerPhone, customerAddress: data.customerAddress,
          items, total, type: "direct", channel: "presencial", status: "Pagado Total",
          deliveryStatus: "Entregado en tienda", deliveredAt: createdAt.toISOString(), date: data.date,
          paymentMethod: data.paymentMethod, paymentReference: data.paymentReference,
          paidAmount: total, notes: data.notes, requiresGuide: false,
          recordedBy: actor.id, recordedByName: actor.name, createdAt: createdAt.toISOString(),
          salidaApproved: true, warehouseApproved: true, warehouseStatus: "Salida Aprobada",
          warehouseSalidaId: movementId, warehouseApprovedAt: createdAt.toISOString(), requestFingerprint: fingerprint
        };
        // Insert the unique order first: concurrent retries cannot deduct inventory twice.
        await Order.create([order], { session });
        const kardexEntries = [];
        for (const [productId, quantity] of totals) {
          const product = byId.get(productId);
          const sizes = structuredClone(product.sizes || {});
          const productItems = items.filter(item => item.productId === productId);
          for (const item of productItems) {
            const size = sizes[item.selectedSize];
            sizes[item.selectedSize] = typeof size === "number"
              ? { stockPhysical: size - item.quantity, stockCommitted: 0 }
              : { ...size, stockPhysical: Number(size.stockPhysical) - item.quantity };
          }
          const balance = Number(product.stockPhysical) - quantity;
          // Do not consume reservations belonging to web customers.
          const updated = await Product.updateOne({ id: productId }, { $set: { stockPhysical: balance, sizes } }, { session });
          if (updated.matchedCount !== 1) reject(`El producto ${product.name} cambió. Actualiza el catálogo antes de registrar la venta.`, 409, "items");
          kardexEntries.push({
            id: `K-POS-${data.requestId}-${kardexEntries.length}`, productId, date: data.date, type: "Salida", quantity,
            reason: "Venta presencial · Entregado en tienda", documentRef: id, balance,
            items: productItems, recordedBy: actor.id, createdAt: createdAt.toISOString(), movementId
          });
        }
        const movement = {
          id: movementId, orderId: id, type: "Salida", originType: "Venta Directa", channel: "presencial",
          status: "Aceptado", items, date: data.date, createdAt: createdAt.toISOString(), processedAt: createdAt.toISOString(),
          requiresGuide: false, reason: "Venta presencial · Entrega en tienda", recordedBy: actor.id, customerName: data.customerName
        };
        await Movement.create([movement], { session });
        await Kardex.create(kardexEntries, { session });
        const subtotal = Number((total / 1.18).toFixed(2));
        // Same series and six-digit internal numbering used by the existing checkout.
        const series = data.docType === "Boleta" ? "B001" : "F001";
        let number;
        for (let attempt = 0; attempt < 10; attempt += 1) {
          number = String(randomInt(100000, 1000000));
          if (!(await Invoice.findOne({ series, number }).session(session).lean())) break;
          number = null;
        }
        if (!number) reject("No se pudo asignar el comprobante. Inténtalo de nuevo.", 409);
        const invoice = {
          id: `INV-POS-${data.requestId}`, orderId: id, type: data.docType, series, number,
          ...(data.customerId ? { userId: data.customerId } : {}),
          customerName: data.customerName, customerDocument: data.customerDocument, customerEmail: data.customerEmail,
          customerAddress: data.customerAddress, customerPhone: data.customerPhone, date: data.date, items,
          subtotal, igv: Number((total - subtotal).toFixed(2)), total, status: "Emitido", channel: "presencial"
        };
        await Invoice.create([invoice], { session });
        return { order, invoice, movement, replayed: false };
      });
    } catch (error) {
      if (error.code === 11000) {
        const existing = await Order.findOne({ id }).session(null).lean();
        if (existing) return replay(existing, null);
      }
      throw error;
    }
  };
}

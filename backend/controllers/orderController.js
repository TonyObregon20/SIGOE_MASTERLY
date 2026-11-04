import OrderModel from "../models/Order.js";
import ProductModel from "../models/Product.js";
import WarehouseMovementModel from "../models/WarehouseMovement.js";
import InvoiceModel from "../models/Invoice.js";
import KardexModel from "../models/Kardex.js";
import ProductionOrderModel from "../models/ProductionOrder.js";
import UserModel from "../models/User.js";

const CREDIT_LIMIT_EXCEEDED_MESSAGE = "Excede su linea de credito";

export const getOrders = async (req, res, next) => {
  try {
    const filter = req.user?.role === "admin"
      ? {}
      : { userId: req.currentUser.id };
    const list = await OrderModel.find(filter).sort({ _id: -1 });
    res.json(list);
  } catch (err) {
    next(err);
  }
};

export const createOrder = async (req, res, next) => {
  let reservedCredit = 0;
  let creditUserId = null;
  try {
    const { order, docType, docNumber, invoiceSeriesNumber, productionOrder } = req.body;

    if (!order || !Array.isArray(order.items) || !Number.isFinite(Number(order.total)) || Number(order.total) <= 0) {
      return res.status(400).json({ success: false, message: "La orden no tiene un total o artículos válidos." });
    }
    if (!["direct", "pedido"].includes(order.type) || order.items.length === 0 || order.items.length > 100) {
      return res.status(400).json({ success: false, message: "La orden contiene datos inválidos." });
    }
    if (await OrderModel.exists({ id: order.id })) {
      return res.status(409).json({ success: false, message: "La orden ya fue procesada." });
    }
    if (!req.currentUser || req.currentUser.id !== order.userId) {
      return res.status(403).json({ success: false, message: "La orden no pertenece al usuario autenticado." });
    }

    const productIds = order.items.map((item) => item?.productId);
    if (productIds.some((id) => typeof id !== "string" || !id.trim()) || new Set(productIds).size !== productIds.length) {
      return res.status(400).json({ success: false, message: "Los productos de la orden no son válidos." });
    }
    const products = await ProductModel.find({ id: { $in: productIds } }).lean();
    const productsById = new Map(products.map((product) => [product.id, product]));
    let computedTotal = 0;
    const validatedItems = [];

    for (const item of validatedItems) {
      const product = productsById.get(item.productId);
      const quantity = Number(item.quantity);
      if (!product || !Number.isInteger(quantity) || quantity <= 0 || quantity > 1000) {
        return res.status(400).json({ success: false, message: "La cantidad o producto de la orden no es válido." });
      }
      if (!Number.isFinite(Number(product.price)) || Number(product.price) < 0) {
        return res.status(400).json({ success: false, message: "El producto tiene un precio inválido." });
      }
      computedTotal += Number(product.price) * quantity;
      validatedItems.push({
        productId: product.id,
        productName: product.name,
        quantity,
        price: Number(product.price),
        selectedSize: typeof item.selectedSize === "string" ? item.selectedSize.slice(0, 50) : undefined,
        sizeDistribution: item.sizeDistribution
      });
    }
    computedTotal = Number(computedTotal.toFixed(2));
    const safeOrder = {
      id: order.id,
      userId: req.currentUser.id,
      customerName: req.currentUser.name,
      items: validatedItems,
      total: computedTotal,
      type: order.type,
      status: order.type === "pedido" ? "Pagado Parcial" : "Pagado Total",
      date: new Date().toISOString().split("T")[0],
      ...(order.type === "pedido" ? {
        initialPayment: Number((computedTotal * 0.5).toFixed(2)),
        estimatedDelivery: order.estimatedDelivery,
        installments: order.installments
      } : {})
    };

    if (order.type === "pedido") {
      const currentUser = req.currentUser;
      const orderTotal = computedTotal;
      const creditLimit = Number(currentUser?.creditLimit);

      if (
        !currentUser.creditEnabled ||
        !Number.isFinite(creditLimit) ||
        creditLimit <= 0 ||
        !Number.isFinite(orderTotal) ||
        orderTotal <= 0
      ) {
        return res.status(409).json({
          success: false,
          code: "CREDIT_LIMIT_EXCEEDED",
          message: CREDIT_LIMIT_EXCEEDED_MESSAGE
        });
      }

      const previousOrders = await OrderModel.find({
        type: "pedido",
        id: { $ne: order.id },
        $or: [
          { userId: currentUser.id },
          { customerName: currentUser.name }
        ]
      }).select("total").lean();
      const historicalUsed = previousOrders.reduce((sum, previousOrder) => {
        const total = Number(previousOrder.total);
        return sum + (Number.isFinite(total) && total > 0 ? total : 0);
      }, 0);
      const persistedUsed = Number(currentUser.creditUsed);
      const effectiveUsed = Math.max(
        historicalUsed,
        Number.isFinite(persistedUsed) && persistedUsed > 0 ? persistedUsed : 0
      );
      const availableCredit = Math.max(creditLimit - effectiveUsed, 0);

      if (orderTotal > availableCredit) {
        return res.status(409).json({
          success: false,
          code: "CREDIT_LIMIT_EXCEEDED",
          message: CREDIT_LIMIT_EXCEEDED_MESSAGE
        });
      }

      // Reconcile legacy records first, then reserve the new order amount.
      const creditReservation = await UserModel.findOneAndUpdate(
        {
          id: currentUser.id,
          creditEnabled: true,
          creditLimit: { $gte: effectiveUsed + orderTotal },
          creditUsed: { $lte: effectiveUsed }
        },
        { $set: { creditUsed: effectiveUsed + orderTotal } },
        { new: true }
      );

      if (!creditReservation) {
        return res.status(409).json({
          success: false,
          code: "CREDIT_LIMIT_EXCEEDED",
          message: CREDIT_LIMIT_EXCEEDED_MESSAGE
        });
      }

      reservedCredit = orderTotal;
      creditUserId = currentUser.id;
    }
    
    // Update stocks if "direct" checkout (Venta Directa)
    if (order.type === "direct") {
      const stockAvailable = validatedItems.every((item) => {
        const product = productsById.get(item.productId);
        return Number(product.stockPhysical || 0) - Number(product.stockCommitted || 0) >= item.quantity;
      });
      if (!stockAvailable) {
        return res.status(409).json({ success: false, message: "Stock insuficiente para completar la compra." });
      }
      for (const item of validatedItems) {
        const updatedProduct = await ProductModel.findOneAndUpdate(
          {
            id: item.productId,
            $expr: {
              $gte: [
                {
                  $subtract: [
                    { $ifNull: ["$stockPhysical", 0] },
                    { $ifNull: ["$stockCommitted", 0] }
                  ]
                },
                item.quantity
              ]
            }
          },
          { $inc: { stockCommitted: item.quantity } },
          { new: true }
        );
        if (!updatedProduct) {
          return res.status(409).json({ success: false, message: "Stock insuficiente para completar la compra." });
        }
      }

      // Generate automatic pending Salida (S-XXX) for Venta Directa
      const movementId = `S-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      await WarehouseMovementModel.create({
        id: movementId,
        type: "Salida",
        originType: "Venta Directa",
        status: "Pendiente",
        orderId: order.id,
        items: validatedItems.map((i) => ({
          productId: i.productId,
          productName: i.productName || "Prenda",
          quantity: i.quantity,
          selectedSize: i.selectedSize
        })),
        date: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString()
      });
    }

    // Create Order in DB
    if (computedTotal <= 0) {
      return res.status(400).json({ success: false, message: "El total calculado de la orden no es válido." });
    }

    const newOrder = await OrderModel.create(safeOrder);

    // Create Invoice
    const subtotal = computedTotal / 1.18;
    const igv = computedTotal - subtotal;
    const invoiceNum = invoiceSeriesNumber || (Math.floor(Math.random() * 900000) + 100000).toString();
    const newInvoice = {
      id: `INV-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      orderId: order.id,
      type: docType || "Boleta",
      series: docType === "Boleta" ? "B001" : "F001",
      number: invoiceNum,
      customerName: safeOrder.customerName,
      customerDocument: docNumber || "00000000",
      date: new Date().toISOString().split("T")[0],
      items: validatedItems,
      subtotal: Number(subtotal.toFixed(2)),
      igv: Number(igv.toFixed(2)),
      total: computedTotal,
      status: "Emitido"
    };

    const createdInvoice = await InvoiceModel.create(newInvoice);

    // If on-demand order ("pedido"), create production order automatically in the same request
    let createdOP = null;
    if (safeOrder.type !== "direct") {
      try {
        const defaultOpPayload = {
            id: `OP-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
            orderId: safeOrder.id,
            items: validatedItems.map((i) => ({
              productId: i.productId,
              productName: i.productName || "Prenda",
              quantityOrdered: i.quantity || 1,
              quantityExtras: 0,
              selectedSize: i.selectedSize,
              sizeDistribution: i.sizeDistribution
            })),
            currentStage: "Tendido",
            progress: 0,
            startDate: new Date().toISOString().split("T")[0],
            stages: [
              { name: "Tendido", status: "in-progress", responsible: "Operario de Tendido", startTime: new Date().toLocaleString() },
              { name: "Corte", status: "pending", responsible: "" },
              { name: "Costura", status: "pending", responsible: "" },
              { name: "Limpieza", status: "pending", responsible: "" },
              { name: "Planchado y Empaquetado", status: "pending", responsible: "" }
            ]
        };
        createdOP = await ProductionOrderModel.create(defaultOpPayload);
      } catch (opErr) {
        console.error("Error creating OP during createOrder:", opErr);
      }
    }

    const updatedUser = creditUserId
      ? await UserModel.findOne({ id: creditUserId }).select("-password").lean()
      : null;

    res.json({
      success: true,
      order: newOrder,
      invoice: createdInvoice,
      productionOrder: createdOP,
      user: updatedUser
    });
  } catch (err) {
    if (reservedCredit && creditUserId) {
      await UserModel.findOneAndUpdate(
        { id: creditUserId, creditUsed: { $gte: reservedCredit } },
        { $inc: { creditUsed: -reservedCredit } }
      ).catch((rollbackError) => {
        console.error("Error rolling back credit reservation:", rollbackError);
      });
    }
    next(err);
  }
};

export const shipOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await OrderModel.findOne({ id: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Orden no encontrada" });
    }

    // Mark order as shipped
    const updatedOrder = await OrderModel.findOneAndUpdate(
      { id: orderId },
      { 
        $set: { 
          status: "Enviado",
          shippedAt: new Date().toISOString()
        } 
      },
      { new: true }
    );

    // Check if a Salida movement was already accepted by Warehouse
    const existingAcceptedSalida = await WarehouseMovementModel.findOne({ 
      orderId: orderId, 
      type: "Salida", 
      status: "Aceptado" 
    });

    // If warehouse has NOT already deducted stock via an accepted Salida movement, perform fallback deduction
    if (!existingAcceptedSalida) {
      for (const item of safeOrder.items || []) {
        const prod = await ProductModel.findOne({ id: item.productId });
        if (prod) {
          const qty = item.quantity || 1;
          const newPhysical = Math.max(0, (prod.stockPhysical || 0) - qty);
          const newCommitted = Math.max(0, (prod.stockCommitted || 0) - qty);
          await ProductModel.findOneAndUpdate(
            { id: item.productId },
            { $set: { stockPhysical: newPhysical, stockCommitted: newCommitted } }
          );

          // Kardex entry
          await KardexModel.create({
            productId: item.productId,
            date: new Date().toISOString().split("T")[0],
            type: "Salida",
            quantity: qty,
            reason: `Despacho Directo Orden ${orderId}`,
            documentRef: orderId,
            balance: newPhysical
          });
        }
      }

      const movementId = `S-${(Math.floor(Math.random() * 900) + 100).toString()}`;
      await WarehouseMovementModel.create({
        id: movementId,
        type: "Salida",
        originType: safeOrder.type === "pedido" ? "A Pedido" : "Venta Directa",
        status: "Aceptado",
        orderId: order.id,
        items: (safeOrder.items || []).map((i) => ({
          productId: i.productId,
          productName: i.productName || "Prenda",
          quantity: i.quantity || 1,
          selectedSize: i.selectedSize
        })),
        date: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
        processedAt: new Date().toISOString()
      });
    }

    res.json({ success: true, order: updatedOrder });
  } catch (err) {
    next(err);
  }
};

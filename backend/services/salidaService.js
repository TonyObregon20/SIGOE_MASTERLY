import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import Movement from "../models/WarehouseMovement.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import ProductionOrder from "../models/ProductionOrder.js";
import Kardex from "../models/Kardex.js";
import { flowError, movementSummary, validateGuideRegistration, validateStoredGuide, validateDispatchGuide } from "../utils/guideValidation.js";

const withPhotos = "+guidePhoto +dispatchGuidePhoto";
const now = () => new Date().toISOString();
const validateId = (value, label) => {
  if (typeof value !== "string" || !value.length || value.length > 150 || value !== value.trim()) throw flowError(`${label} no válido.`);
};
const itemKey = (item) => `${item.productId}:${item.selectedSize || "M"}`;

// Dependencies are injectable so all mutation paths can be tested without a DB
// connection. Production always uses a MongoDB transaction; there is no unsafe
// nontransactional fallback if the database cannot support one.
export function createSalidaService({ models = { Movement, Order, Product, ProductionOrder, Kardex }, transaction = (work) => mongoose.connection.transaction(work) } = {}) {
  const { Movement: WM, Order: Orders, Product: Products, ProductionOrder: OPs, Kardex: Ledger } = models;
  const findMovement = (query, session) => WM.findOne(query).select(withPhotos).session(session);
  const findMovements = (query, session) => WM.find(query).select(withPhotos).session(session);

  async function lockOrder(order, session) {
    if (order) await Orders.findOneAndUpdate({ id: order.id }, { $inc: { warehouseRevision: 1 } }, { session });
  }

  async function applyStock(movement, session) {
    for (const item of movement.items || []) {
      const qty = Number(item.quantity);
      if (!item.productId || !Number.isSafeInteger(qty) || qty <= 0) throw flowError("Las cantidades de salida deben ser enteros positivos.");
      const product = await Products.findOne({ id: item.productId }).session(session);
      if (!product) throw flowError(`Producto ${item.productId} no encontrado.`, 404);
      if ((product.stockPhysical || 0) < qty) throw flowError(`Stock insuficiente para ${item.productName || item.productId}.`, 409);
      const physical = product.stockPhysical - qty;
      const sizes = product.sizes ? structuredClone(product.sizes) : {};
      const size = item.selectedSize || "M";
      if (!sizes[size] || typeof sizes[size] !== "object") throw flowError(`La talla ${size} no tiene stock verificable; concilie las tallas históricas antes de continuar.`, 409);
      if (sizes[size] && typeof sizes[size] === "object") {
        if ((Number(sizes[size].stockPhysical) || 0) < qty) throw flowError(`Stock insuficiente en talla ${size}; si el stock histórico está desactualizado, requiere conciliación.`, 409);
        sizes[size] = { ...sizes[size], stockPhysical: Number(sizes[size].stockPhysical) - qty, stockCommitted: Math.max(0, (Number(sizes[size].stockCommitted) || 0) - qty) };
      }
      await Products.findOneAndUpdate({ id: product.id }, { $set: {
        stockPhysical: physical,
        stockCommitted: Math.max(0, (product.stockCommitted || 0) - qty),
        sizes
      } }, { session });
      await Ledger.create([{
        id: `K-${randomUUID()}`, productId: item.productId, date: now().split("T")[0], type: "Salida",
        quantity: qty, reason: `Salida Aceptada ${movement.id} (${movement.originType}) [Talla: ${size}]`,
        documentRef: movement.orderId || movement.opId || movement.id, movementId: movement.id, balance: physical
      }], { session });
    }
  }

  async function approve(movement, session) {
    await validateStoredGuide(movement);
    if (movement.status === "Aceptado") return movement;
    if (movement.status !== "Pendiente") throw flowError("Solo se pueden aprobar salidas pendientes.", 409);
    if (movement.stockApplied) throw flowError("Esta salida ya afectó el inventario; revise su estado antes de continuar.", 409);
    const scope = movement.orderId ? { orderId: movement.orderId } : null;
    if (scope) {
      const approved = await findMovements({ ...scope, type: "Salida", status: "Aceptado" }, session);
      if (approved.some((m) => m.id !== movement.id && !m.dispatchedAt)) throw flowError("Ya existe otra salida aprobada pendiente de despacho. No se descontará el inventario nuevamente.", 409);
    }
    if (!movement.orderId && movement.opId) {
      const incoming = await findMovements({ opId: movement.opId, type: "Ingreso", status: "Aceptado" }, session);
      const outgoing = await findMovements({ opId: movement.opId, type: "Salida", status: "Aceptado" }, session);
      const balances = new Map();
      for (const [list, sign] of [[incoming, 1], [outgoing, -1]]) for (const m of list) for (const item of m.items || []) balances.set(itemKey(item), (balances.get(itemKey(item)) || 0) + sign * Number(item.quantity || 0));
      for (const item of movement.items || []) {
        const key = itemKey(item);
        const remaining = (balances.get(key) || 0) - Number(item.quantity);
        if (remaining < 0) throw flowError("La salida supera el saldo disponible de la OP.", 409);
        balances.set(key, remaining);
      }
    }
    await applyStock(movement, session);
    const updated = await WM.findOneAndUpdate({ id: movement.id, status: "Pendiente" }, { $set: {
      status: "Aceptado", stockApplied: true, processedAt: now()
    } }, { new: true, session }).select(withPhotos);
    if (!updated) throw flowError("La salida cambió; actualice e intente nuevamente.", 409);
    if (movement.orderId) await Orders.findOneAndUpdate({ id: movement.orderId }, { $set: {
      salidaApproved: true, warehouseApproved: true, warehouseStatus: "Salida Aprobada",
      warehouseSalidaId: movement.id, warehouseApprovedAt: now()
    } }, { session });
    return updated;
  }

  return {
    async create(payload = {}) {
      if (payload.orderId != null) validateId(payload.orderId, "Pedido");
      if (payload.opId != null) validateId(payload.opId, "OP");
      const registration = await validateGuideRegistration(payload);
      if (payload.autoAccept !== undefined && typeof payload.autoAccept !== "boolean") throw flowError("autoAccept debe ser un booleano.");
      if (typeof payload.requestId !== "string" || !/^[\w-]{8,100}$/.test(payload.requestId)) throw flowError("La solicitud debe incluir un identificador válido; vuelva a abrir el formulario.");
      return transaction(async (session) => {
        let order = payload.orderId ? await Orders.findOne({ id: payload.orderId }).session(session) : null;
        const op = payload.opId ? await OPs.findOne({ id: payload.opId }).session(session) : null;
        if (payload.orderId && !order) throw flowError("Pedido no encontrado.", 404);
        if (payload.opId && !op) throw flowError("OP no encontrada.", 404);
        if (op?.orderId && order && op.orderId !== order.id) throw flowError("La OP no pertenece al pedido seleccionado.");
        if (!order && op?.orderId) order = await Orders.findOne({ id: op.orderId }).session(session);
        const replay = await findMovement({ creationRequestId: payload.requestId }, session);
        if (replay) {
          if (replay.orderId !== (order?.id || null) || replay.opId !== (op?.id || null) || replay.guideMode !== registration.guideMode || replay.guideNumber !== registration.guideNumber) throw flowError("El identificador de solicitud ya se utilizó para otra salida.", 409);
          if (payload.items?.length) {
            const signature = (items) => JSON.stringify(items.map((i) => [itemKey(i), Number(i.quantity)]).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
            if (signature(payload.items) !== signature(replay.items || [])) throw flowError("El identificador de solicitud ya se utilizó con otras cantidades.", 409);
          }
          if (registration.guidePhoto !== replay.guidePhoto) throw flowError("El identificador de solicitud ya se utilizó con otra fotografía.", 409);
          return movementSummary(replay);
        }
        await lockOrder(order, session);
        if (order?.status === "Enviado") throw flowError("El pedido ya fue despachado.", 409);
        const scope = order ? { orderId: order.id } : op ? { opId: op.id } : null;
        // Serialize OP-only requests too, including concurrent create attempts.
        if (!order && op) await OPs.findOneAndUpdate({ id: op.id }, { $inc: { warehouseRevision: 1 } }, { session });
        const existing = scope ? await findMovements({ ...scope, type: "Salida" }, session) : [];
        if (order && existing.some((m) => m.status === "Aceptado" && !m.dispatchedAt)) throw flowError("Ya existe una salida aprobada pendiente de despacho para este pedido/OP.", 409);
        const pending = existing.filter((m) => m.status === "Pendiente");
        if (pending.some((m) => m.guideMode != null)) throw flowError("Ya existe una salida registrada. Apruébela desde Almacén.", 409);
        if (pending.length > 1) throw flowError("Existen varias salidas pendientes; revise los movimientos antes de continuar.", 409);
        const draft = pending[0];
        // Only a server-created direct-sale draft may be configured in place.
        if (draft && !(order?.type === "direct" && draft.automaticDraft === true && draft.guideVersion === 1 && draft.originType === "Venta Directa" && !draft.creationRequestId && !draft.stockApplied)) throw flowError("Ya existe una salida pendiente para este pedido/OP.", 409);
        let items = payload.items?.length ? payload.items : (order?.items || op?.items || []).map((i) => ({
          productId: i.productId, productName: i.productName || "Prenda", selectedSize: i.selectedSize,
          quantity: i.quantity ?? ((Number(i.quantityOrdered) || 0) + (Number(i.quantityExtras) || 0))
        }));
        const relatedOp = op || (order ? await OPs.findOne({ orderId: order.id }).session(session) : null);
        if (order?.type === "pedido" || relatedOp) {
          const links = [...(order ? [{ orderId: order.id }] : []), ...(relatedOp ? [{ opId: relatedOp.id }] : [])];
          const incoming = await findMovements({ type: "Ingreso", status: "Aceptado", $or: links }, session);
          const outgoing = await findMovements({ type: "Salida", status: "Aceptado", $or: links }, session);
          const balances = new Map();
          for (const [list, sign] of [[incoming, 1], [outgoing, -1]]) for (const m of list) for (const item of m.items || []) {
            const key = itemKey(item);
            const previous = balances.get(key);
            balances.set(key, { ...item, quantity: (previous?.quantity || 0) + sign * Number(item.quantity || 0) });
          }
          if (!payload.items?.length) items = [...balances.values()].filter((i) => i.quantity > 0);
          const requested = new Map();
          for (const item of items) requested.set(itemKey(item), (requested.get(itemKey(item)) || 0) + Number(item.quantity));
          for (const [key, qty] of requested) if (qty > (balances.get(key)?.quantity || 0)) throw flowError("La salida supera las prendas recibidas y disponibles para este pedido/OP.", 409);
        }
        if (!Array.isArray(items) || !items.length || items.some((i) => !i.productId || !Number.isSafeInteger(Number(i.quantity)) || Number(i.quantity) <= 0)) throw flowError("Debe indicar prendas con cantidades enteras positivas y disponibles en almacén.");
        items = items.map((i) => ({ ...i, quantity: Number(i.quantity) }));
        const originType = order ? (order.type === "pedido" ? "A Pedido" : "Venta Directa") : "Autostock";
        const data = {
          ...registration, creationRequestId: payload.requestId, automaticDraft: false,
          orderId: order?.id || null, opId: op?.id || null, type: "Salida", originType,
          items, reason: typeof payload.reason === "string" ? payload.reason : `Salida por ${originType}`,
          notes: typeof payload.notes === "string" ? payload.notes : ""
        };
        let movement;
        if (draft) movement = await WM.findOneAndUpdate({ id: draft.id, status: "Pendiente", automaticDraft: true, guideVersion: 1, originType: "Venta Directa", guideMode: { $exists: false }, creationRequestId: { $exists: false }, stockApplied: { $ne: true } }, { $set: data }, { new: true, session }).select(withPhotos);
        else [movement] = await WM.create([{ ...data, id: `S-${payload.requestId}`, status: "Pendiente", date: now().split("T")[0], createdAt: now() }], { session });
        if (!movement) throw flowError("La salida ya fue configurada por otro usuario.", 409);
        if (payload.autoAccept === true) movement = await approve(movement, session);
        return movementSummary(movement);
      });
    },

    async accept(movementId) {
      validateId(movementId, "Movimiento");
      return transaction(async (session) => {
        const movement = await findMovement({ id: movementId, type: "Salida" }, session);
        if (!movement) throw flowError("Salida no encontrada.", 404);
        await validateStoredGuide(movement);
        if (movement.status === "Aceptado") return movementSummary(movement);
        const order = movement.orderId ? await Orders.findOne({ id: movement.orderId }).session(session) : null;
        if (order?.status === "Enviado" && movement.status !== "Aceptado") throw flowError("El pedido ya fue despachado.", 409);
        await lockOrder(order, session);
        if (!order && movement.opId) await OPs.findOneAndUpdate({ id: movement.opId }, { $inc: { warehouseRevision: 1 } }, { session });
        return movementSummary(await approve(movement, session));
      });
    },

    async ship(payload = {}) {
      validateId(payload.orderId, "Pedido");
      if (payload.guides !== undefined && (!Array.isArray(payload.guides) || payload.guides.some((g) => !g || typeof g !== "object" || typeof g.movementId !== "string"))) throw flowError("Las confirmaciones de guía deben ser una lista válida.");
      return transaction(async (session) => {
        const order = await Orders.findOne({ id: payload.orderId }).session(session);
        if (!order) throw flowError("Orden no encontrada.", 404);
        const all = await findMovements({ orderId: order.id, type: "Salida" }, session);
        // Validate every guided movement on the order: choosing a different or
        // historical movement must never turn a guided order into SIN GUIA.
        const guided = all.filter((m) => m.guideMode === "CON_GUIA");
        const confirmations = [];
        for (const movement of all) {
          await validateStoredGuide(movement);
          if (movement.guideMode === "CON_GUIA") {
            const evidence = guided.length === 1 ? payload : payload.guides?.find((g) => g.movementId === movement.id);
            if (!evidence || (guided.length === 1 && payload.movementId !== movement.id)) throw flowError(`Ingrese nuevamente el número y la fotografía de la guía de la salida ${movement.id}.`);
            confirmations.push([movement, await validateDispatchGuide(movement, evidence)]);
          }
        }
        if (order.status === "Enviado") return order;
        let accepted = all.filter((m) => m.status === "Aceptado");
        if (guided.some((m) => m.status !== "Aceptado")) throw flowError("La salida CON GUÍA debe estar aprobada antes de despachar.", 409);
        if (all.some((m) => m.guideVersion != null && m.status !== "Aceptado")) throw flowError("Complete y apruebe las salidas pendientes antes de despachar.", 409);
        if (order.warehouseGuideVersion && !accepted.length) throw flowError("Genere y apruebe la salida de almacén antes de despachar.", 409);
        await lockOrder(order, session);
        // Historical fallback only. Modern orders and guided movements cannot
        // enter here. Reuse a legacy pending movement instead of duplicating it.
        if (!accepted.length) {
          if (all.length > 1) throw flowError("Hay varias salidas pendientes; apruébelas en Almacén.", 409);
          let legacy = all[0];
          if (legacy && legacy.status !== "Pendiente") throw flowError("La salida no está disponible para despacho.", 409);
          if (!legacy) [legacy] = await WM.create([{
            id: `S-${randomUUID()}`, type: "Salida", originType: order.type === "pedido" ? "A Pedido" : "Venta Directa",
            orderId: order.id, status: "Pendiente", items: order.items || [], createdAt: now(), date: now().split("T")[0]
          }], { session });
          accepted = [await approve(legacy, session)];
        }
        for (const [movement, evidence] of confirmations) await WM.findOneAndUpdate({ id: movement.id }, { $set: evidence }, { session });
        for (const movement of accepted) await WM.findOneAndUpdate({ id: movement.id }, { $set: { dispatchedAt: now() } }, { session });
        return Orders.findOneAndUpdate({ id: order.id }, { $set: { status: "Enviado", shippedAt: now() } }, { new: true, session });
      });
    }
  };
}

export const salidaService = createSalidaService();

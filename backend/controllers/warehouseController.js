import { randomUUID } from "node:crypto";
import WarehouseMovementModel from "../models/WarehouseMovement.js";
import GuideSequence from "../models/GuideSequence.js";
import OrderModel from "../models/Order.js";
import ProductModel from "../models/Product.js";
import ProductionOrderModel from "../models/ProductionOrder.js";
import KardexModel from "../models/Kardex.js";

export const getWarehouseMovements = async (req, res, next) => {
  try {
    let list = await WarehouseMovementModel.find().sort({ createdAt: -1 });
    
    // Auto-sync any historically shipped orders that don't have a Salida record
    const shippedOrders = await OrderModel.find({ status: "Enviado" });
    const productsList = await ProductModel.find();
    
    for (const order of shippedOrders) {
      const hasSalida = list.some((wm) => wm.orderId === order.id && wm.type === "Salida");
      if (!hasSalida) {
        const movementId = `S-${(Math.floor(Math.random() * 900) + 100).toString()}`;
        const itemsMapped = (order.items || []).map((i) => {
          const p = productsList.find((p) => p.id === i.productId);
          return {
            productId: i.productId,
            productName: p ? p.name : (i.productName || "Prenda"),
            quantity: i.quantity || 1,
            selectedSize: i.selectedSize
          };
        });

        const newSalida = await WarehouseMovementModel.create({
          id: movementId,
          type: "Salida",
          originType: order.type === "pedido" ? "A Pedido" : "Venta Directa",
          status: "Aceptado",
          orderId: order.id,
          items: itemsMapped,
          date: order.date || new Date().toISOString().split("T")[0],
          createdAt: new Date().toISOString(),
          processedAt: new Date().toISOString()
        });
        list.unshift(newSalida);
      }
    }

    res.json(list);
  } catch (err) {
    next(err);
  }
};

const warehouseDate = (date) => new Intl.DateTimeFormat("sv-SE", {
  timeZone: "America/Lima"
}).format(date);

async function approveSalida(movement, session, now) {
  movement.status = "Aceptado";
  movement.processedAt = now.toISOString();
  await movement.save({ session });

  for (const item of movement.items) {
    const product = await ProductModel.findOne({ id: item.productId }).session(session);
    if (!product) continue;

    const quantity = Number(item.quantity) || 0;
    const stockPhysical = Math.max(0, (product.stockPhysical || 0) - quantity);
    const stockCommitted = Math.max(0, (product.stockCommitted || 0) - quantity);
    const sizes = { ...product.sizes };
    const sizesToDeduct = item.sizeDistribution && !item.selectedSize
      ? Object.entries(item.sizeDistribution)
      : [[item.selectedSize || "M", quantity]];
    for (const [size, units] of sizesToDeduct) {
      if (!sizes[size] || Number(units) <= 0 || !Number.isFinite(Number(units))) continue;
      sizes[size] = {
        ...sizes[size],
        stockPhysical: Math.max(0, (Number(sizes[size].stockPhysical) || 0) - Number(units)),
        stockCommitted: Math.max(0, (Number(sizes[size].stockCommitted) || 0) - Number(units))
      };
    }

    await ProductModel.updateOne({ id: item.productId }, { $set: { stockPhysical, stockCommitted, sizes } }, { session });
    await new KardexModel({
      productId: item.productId,
      date: warehouseDate(now),
      type: "Salida",
      quantity,
      reason: "Salida aceptada " + (movement.guideNumber || movement.id) + " (" + movement.originType + ")",
      documentRef: movement.orderId || movement.opId || movement.id,
      balance: stockPhysical
    }).save({ session });
  }

  if (movement.orderId) {
    await OrderModel.updateOne({ id: movement.orderId }, {
      $set: {
        salidaApproved: true,
        warehouseApproved: true,
        warehouseStatus: "Salida Aprobada",
        warehouseSalidaId: movement.id,
        warehouseApprovedAt: movement.processedAt
      }
    }, { session });
  }
  return movement;
}

export const acceptWarehouseMovement = async (req, res, next) => {
  try {
    const { movementId } = req.body;
    const movement = await WarehouseMovementModel.findOne({ id: movementId });
    if (!movement) {
      return res.status(404).json({ success: false, message: "Movimiento de almacén no encontrado" });
    }
    if (movement.status !== "Pendiente") {
      return res.status(400).json({ success: false, message: "El movimiento ya no está pendiente" });
    }

    if (movement.type === "Salida") {
      const outcome = await WarehouseMovementModel.db.transaction(async (session) => {
        const pending = await WarehouseMovementModel.findOne({ id: movementId, status: "Pendiente" }).session(session);
        if (!pending) return { status: 409, message: "La salida ya fue procesada" };
        if ((pending.orderId || pending.opId) && (!pending.guideNumber || !pending.carrier?.trim())) {
          return { status: 409, message: "Primero registra la guía y el transportista en Generar Salida." };
        }
        return { movement: await approveSalida(pending, session, new Date()) };
      });
      if (!outcome.movement) {
        return res.status(outcome.status).json({ success: false, message: outcome.message });
      }
      return res.json({ success: true, movement: outcome.movement });
    }

    // A Pedido increases committed stock as well as physical stock.
    for (const item of movement.items) {
      const prod = await ProductModel.findOne({ id: item.productId });
      if (!prod) continue;

      const qty = item.quantity || 0;
      const newPhysical = (prod.stockPhysical || 0) + qty;
      const newCommitted = (prod.stockCommitted || 0) + (movement.originType === "A Pedido" ? qty : 0);
      await ProductModel.findOneAndUpdate(
        { id: item.productId },
        { $set: { stockPhysical: newPhysical, stockCommitted: newCommitted } }
      );
      await KardexModel.create({
        productId: item.productId,
        date: new Date().toISOString().split("T")[0],
        type: "Ingreso",
        quantity: qty,
        reason: "Ingreso Aceptado " + movement.id + " (" + movement.originType + ") - OP: " + (movement.opId || "S/OP"),
        documentRef: movement.opId || movement.orderId || movement.id,
        balance: newPhysical
      });
    }

    const updatedMovement = await WarehouseMovementModel.findOneAndUpdate(
      { id: movementId },
      { $set: { status: "Aceptado", processedAt: new Date().toISOString() } },
      { new: true }
    );

    res.json({ success: true, movement: updatedMovement });
  } catch (err) {
    next(err);
  }
};

const guideSequenceId = "warehouse-salida";
const formatGuideNumber = (number) => "GR-" + String(number).padStart(5, "0");

export const getNextGuideNumber = async (req, res, next) => {
  try {
    const sequence = await GuideSequence.findById(guideSequenceId).lean();
    res.set("Cache-Control", "no-store");
    res.json({ success: true, guideNumber: formatGuideNumber((sequence?.lastNumber || 0) + 1) });
  } catch (err) {
    next(err);
  }
};

export const createSalidaMovement = async (req, res, next) => {
  try {
    const { orderId, opId, items, guideNumber, carrier, reason, notes, autoAccept } = req.body;
    if ((orderId != null && typeof orderId !== "string") || (opId != null && typeof opId !== "string")) {
      return res.status(400).json({ success: false, message: "El pedido o la OP no son válidos." });
    }
    const requiresGuide = Boolean(orderId || opId);
    if (requiresGuide && (typeof guideNumber !== "string" || !/^GR-[0-9]{5,16}$/.test(guideNumber))) {
      return res.status(400).json({ success: false, message: "El número de guía no es válido." });
    }
    if (requiresGuide && (typeof carrier !== "string" || !carrier.trim() || carrier.trim().length > 160)) {
      return res.status(400).json({ success: false, message: "Ingresa el transportista (máximo 160 caracteres)." });
    }
    const observations = typeof reason === "string" ? reason.trim().slice(0, 500) : "";

    const outcome = await WarehouseMovementModel.db.transaction(async (session) => {
      const targetOp = opId
        ? await ProductionOrderModel.findOne({ id: opId }).session(session)
        : null;
      if (opId && !targetOp) return { status: 404, message: "Orden de producción no encontrada." };
      if (opId && orderId && targetOp.orderId !== orderId) {
        return { status: 400, message: "La OP no corresponde al pedido seleccionado." };
      }
      const linkedOrderId = orderId || targetOp?.orderId;
      const targetOrder = linkedOrderId
        ? await OrderModel.findOne({ id: linkedOrderId }).session(session)
        : null;
      if (linkedOrderId && !targetOrder) return { status: 404, message: "Pedido no encontrado." };
      if (targetOrder?.status === "Enviado") {
        return { status: 409, message: "Este pedido ya fue despachado." };
      }

      const relatedOp = targetOp || (targetOrder
        ? await ProductionOrderModel.findOne({ orderId: targetOrder.id }).session(session)
        : null);
      const links = [];
      if (targetOrder) links.push({ orderId: targetOrder.id });
      if (relatedOp) links.push({ opId: relatedOp.id });

      const existingSalidas = links.length
        ? await WarehouseMovementModel.find({
            type: "Salida",
            status: { $in: ["Aceptado", "Pendiente"] },
            $or: links
          }).sort({ createdAt: -1 }).session(session)
        : [];
      const guidedSalida = existingSalidas.find((movement) => movement.guideNumber && movement.carrier?.trim());
      if (guidedSalida) {
        return guidedSalida.guideNumber === guideNumber
          ? { movement: guidedSalida }
          : { status: 409, message: "Ya existe una guía para este pedido u OP." };
      }

      // Upgrade the existing reservation or accepted movement, keeping its stock history.
      const existingSalida = existingSalidas.find((movement) => movement.status === "Aceptado") || existingSalidas[0];

      let salidaItems = existingSalida?.items?.length ? existingSalida.items : null;
      if (!salidaItems && targetOrder) {
        salidaItems = (targetOrder.items || []).map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: Number(item.quantity) || 1,
          selectedSize: item.selectedSize,
          sizeDistribution: item.sizeDistribution
        }));
      }
      if (!salidaItems && targetOp) {
        salidaItems = (targetOp.items || []).map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: (Number(item.quantityOrdered) || 0) + (Number(item.quantityExtras) || 0),
          selectedSize: item.selectedSize,
          sizeDistribution: item.sizeDistribution
        }));
      }
      if (!salidaItems) salidaItems = Array.isArray(items) ? items : [];
      if (!salidaItems.length || salidaItems.some((item) =>
        typeof item?.productId !== "string" || !item.productId.trim() ||
        !Number.isSafeInteger(Number(item.quantity)) || Number(item.quantity) <= 0
      )) {
        return { status: 400, message: "La salida debe contener prendas con cantidades válidas." };
      }

      if (existingSalida?.status !== "Aceptado" && (relatedOp || targetOrder?.type === "pedido")) {
        if (targetOp && targetOp.currentStage !== "Finalizado" && targetOp.progress !== 100) {
          return { status: 409, message: "La orden de producción debe estar finalizada." };
        }
        const acceptedIngresos = await WarehouseMovementModel.find({
          type: "Ingreso", status: "Aceptado", $or: links
        }).session(session);
        const totalReceived = acceptedIngresos.reduce((sum, ingreso) => {
          const units = (ingreso.items || []).reduce((total, item) => total + (Number(item.quantity) || 0), 0);
          return sum + (units || Number(ingreso.quantity) || 0);
        }, 0);
        const totalRequested = salidaItems.reduce((sum, item) => sum + Number(item.quantity), 0);
        if (totalReceived < totalRequested) {
          return { status: 409, message: "Acepta primero en Almacén el ingreso de todas las prendas de esta salida." };
        }
      }

      const products = await ProductModel.find({ id: { $in: salidaItems.map((item) => item.productId) } })
        .select("id name").session(session).lean();
      const names = new Map(products.map((product) => [product.id, product.name]));
      const now = new Date();
      const originType = targetOp ? "Producción OP"
        : targetOrder ? (targetOrder.type === "pedido" ? "A Pedido" : "Venta Directa")
        : "Ajuste / Merma";

      if (requiresGuide) {
        const sequence = await GuideSequence.findById(guideSequenceId).session(session);
        const nextNumber = (sequence?.lastNumber || 0) + 1;
        const nextGuideNumber = formatGuideNumber(nextNumber);
        if (guideNumber !== nextGuideNumber) {
          return {
            status: 409,
            code: "GUIDE_NUMBER_CHANGED",
            guideNumber: nextGuideNumber,
            message: "El número de guía cambió. Revisa el nuevo número y vuelve a guardar."
          };
        }
        if (sequence) {
          sequence.lastNumber = nextNumber;
          await sequence.save({ session });
        } else {
          await new GuideSequence({ _id: guideSequenceId, lastNumber: nextNumber }).save({ session });
        }
      }

      // The linked movement ID makes concurrent creation for the same source conflict.
      const id = targetOrder ? "S-G-ORD-" + targetOrder._id
        : targetOp ? "S-G-OP-" + targetOp._id : "S-" + randomUUID();
      const movement = existingSalida || new WarehouseMovementModel({
        id,
        type: "Salida",
        originType,
        date: warehouseDate(now),
        createdAt: now.toISOString()
      });

      movement.set({
        orderId: targetOrder?.id || null,
        opId: relatedOp?.id || null,
        items: salidaItems.map((item) => ({
          ...item,
          productName: item.productName && item.productName !== "Prenda"
            ? item.productName : names.get(item.productId) || item.productId,
          quantity: Number(item.quantity)
        })),
        reason: movement.reason || observations || ("Salida por " + originType)
      });
      if (requiresGuide) {
        movement.set({
          guideNumber,
          carrier: carrier.trim(),
          guideObservations: observations,
          guideIssuedAt: now.toISOString(),
          guideCustomerName: targetOrder?.customerName
        });
      } else {
        movement.set("notes", typeof notes === "string" ? notes.trim() : "");
      }
      if (movement.status === "Pendiente" && autoAccept === true) {
        await approveSalida(movement, session, now);
      } else {
        await movement.save({ session });
      }

      return { movement };
    });

    if (!outcome.movement) {
      return res.status(outcome.status).json({
        success: false,
        message: outcome.message,
        code: outcome.code,
        guideNumber: outcome.guideNumber
      });
    }
    res.json({ success: true, movement: outcome.movement });
  } catch (err) {
    if (err.code === 11000) {
      if (err.keyValue?._id === guideSequenceId) {
        return res.status(409).json({
          success: false,
          code: "GUIDE_NUMBER_CHANGED",
          message: "El número de guía cambió. Revisa el nuevo número y vuelve a guardar."
        });
      }
      return res.status(409).json({
        success: false,
        message: "Ya existe una salida o guía con estos datos. Actualiza los movimientos antes de volver a intentar."
      });
    }
    next(err);
  }
};

export const createIngresoMovement = async (req, res, next) => {
  try {
    const { opId, orderId, items, originType: customOriginType, reason, notes, autoAccept } = req.body;

    let targetOp = null;
    let targetOrder = null;

    if (opId) {
      targetOp = await ProductionOrderModel.findOne({ id: opId });
      if (!targetOp) {
        return res.status(404).json({ success: false, message: `OP ${opId} no encontrada.` });
      }
      if (targetOp.orderId) {
        targetOrder = await OrderModel.findOne({ id: targetOp.orderId });
      }
    } else if (orderId) {
      targetOrder = await OrderModel.findOne({ id: orderId });
      if (targetOrder) {
        targetOp = await ProductionOrderModel.findOne({ orderId: targetOrder.id });
      }
    }

    // VALIDATION: If linked to an OP, verify that units are pending to enter warehouse
    if (targetOp) {
      const totalOpUnits = (targetOp.items || []).reduce(
        (sum, i) => sum + (Number(i.quantityOrdered) || 0) + (Number(i.quantityExtras) || 0),
        0
      );

      // Check existing ingress movements for this OP
      const existingIngresos = await WarehouseMovementModel.find({
        opId: targetOp.id,
        type: "Ingreso"
      });

      const alreadyIngressedQty = existingIngresos.reduce((sum, wm) => {
        const itemSum = (wm.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
        return sum + (itemSum || Number(wm.quantity) || 0);
      }, 0);

      if (totalOpUnits > 0 && alreadyIngressedQty >= totalOpUnits) {
        return res.status(400).json({
          success: false,
          message: `La OP ${targetOp.id} ya ingresó el 100% de sus unidades a almacén (${alreadyIngressedQty}/${totalOpUnits} uds).`
        });
      }
    }

    let itemsToProcess = [];
    if (items && Array.isArray(items) && items.length > 0) {
      itemsToProcess = items;
    } else if (targetOp && targetOp.items && targetOp.items.length > 0) {
      const existingIngresos = await WarehouseMovementModel.find({
        opId: targetOp.id,
        type: "Ingreso"
      });
      const alreadyIngressedQty = existingIngresos.reduce((sum, wm) => {
        const itemSum = (wm.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
        return sum + (itemSum || Number(wm.quantity) || 0);
      }, 0);
      const ingressByItem = existingIngresos.reduce((totals, movement) => {
        (movement.items || []).forEach((item) => {
          const key = `${item.productId}:${item.selectedSize || ""}`;
          totals[key] = (totals[key] || 0) + (Number(item.quantity) || 0);
        });
        return totals;
      }, {});

      itemsToProcess = targetOp.items.map((i) => {
        const totalItemQty = (Number(i.quantityOrdered) || 0) + (Number(i.quantityExtras) || 0) || 1;
        const key = `${i.productId}:${i.selectedSize || ""}`;
        const remainingQty = Math.max(0, totalItemQty - (ingressByItem[key] || 0));
        return {
          productId: i.productId,
          productName: i.productName || "Prenda",
          quantity: remainingQty,
          selectedSize: i.selectedSize
        };
      });
    } else if (targetOrder && targetOrder.items) {
      itemsToProcess = targetOrder.items.map((i) => ({
        productId: i.productId,
        productName: i.productName || "Prenda",
        quantity: i.quantity || 1,
        selectedSize: i.selectedSize
      }));
    }

    if (itemsToProcess.length === 0) {
      return res.status(400).json({ success: false, message: "No se especificaron prendas para el ingreso." });
    }

    const movementId = `I-${(Math.floor(Math.random() * 900) + 100).toString()}`;
    const isPedido = Boolean(targetOrder || (targetOp && targetOp.orderId));
    const resolvedOriginType = customOriginType || (isPedido ? "A Pedido" : (targetOp ? "Autostock" : "Ingreso Manual"));

    const shouldAutoAccept = autoAccept !== undefined ? Boolean(autoAccept) : true;

    const newIngreso = await WarehouseMovementModel.create({
      id: movementId,
      type: "Ingreso",
      originType: resolvedOriginType,
      status: shouldAutoAccept ? "Aceptado" : "Pendiente",
      orderId: targetOrder?.id || (targetOp?.orderId || null),
      opId: targetOp?.id || opId || null,
      items: itemsToProcess,
      reason: reason || (targetOp ? `Ingreso por culminación de OP ${targetOp.id}` : `Ingreso por ${resolvedOriginType}`),
      notes: notes || "",
      date: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      processedAt: shouldAutoAccept ? new Date().toISOString() : null
    });

    if (shouldAutoAccept) {
      // Ingreso:
      // A Pedido -> aumenta Stock Físico y Stock Comprometido
      // Autostock -> aumenta solo Stock Físico
      for (const item of itemsToProcess) {
        const prod = await ProductModel.findOne({ id: item.productId });
        if (prod) {
          const qty = item.quantity || 0;
          const newPhysical = (prod.stockPhysical || 0) + qty;
          const newCommitted = resolvedOriginType === "A Pedido"
            ? (prod.stockCommitted || 0) + qty
            : (prod.stockCommitted || 0);

          await ProductModel.findOneAndUpdate(
            { id: item.productId },
            { $set: { stockPhysical: newPhysical, stockCommitted: newCommitted } }
          );

          await KardexModel.create({
            productId: item.productId,
            date: new Date().toISOString().split("T")[0],
            type: "Ingreso",
            quantity: qty,
            reason: `Ingreso Aceptado ${movementId} (${resolvedOriginType}) - OP: ${targetOp?.id || "S/OP"}`,
            documentRef: targetOp?.id || targetOrder?.id || movementId,
            balance: newPhysical
          });
        }
      }
    }

    res.json({ success: true, movement: newIngreso });
  } catch (err) {
    next(err);
  }
};

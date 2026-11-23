import WarehouseMovementModel from "../models/WarehouseMovement.js";
import OrderModel from "../models/Order.js";
import ProductModel from "../models/Product.js";
import ProductionOrderModel from "../models/ProductionOrder.js";
import KardexModel from "../models/Kardex.js";
import { salidaService } from "../services/salidaService.js";
import { ingressStock } from "../utils/inventoryStock.js";
import { warehouseReadModel } from "../utils/warehouseReadModel.js";

export const getWarehouseMovements = async (req, res, next) => {
  try {
    const list = await WarehouseMovementModel.find().sort({ createdAt: -1 });
    const shipped = await OrderModel.find({ status: "Enviado" });
    const products = await ProductModel.find();
    res.json(warehouseReadModel(list, shipped, products));
  } catch (err) {
    next(err);
  }
};

export const acceptWarehouseMovement = async (req, res, next) => {
  try {
    const { movementId } = req.body;
    const movement = await WarehouseMovementModel.findOne({ id: movementId });
    if (!movement) {
      return res.status(404).json({ success: false, message: "Movimiento de almacén no encontrado" });
    }
    if (movement.type === "Salida") {
      const approved = await salidaService.accept(movementId);
      return res.json({ success: true, movement: approved });
    }
    if (movement.status === "Aceptado") {
      return res.status(400).json({ success: false, message: "El movimiento ya fue aceptado anteriormente" });
    }

    if (movement.type === "Ingreso") {
      // Ingreso:
      // A Pedido -> aumenta Stock Físico y Stock Comprometido
      // Autostock -> aumenta solo Stock Físico
      for (const item of movement.items) {
        const prod = await ProductModel.findOne({ id: item.productId });
        if (prod) {
          const qty = Number(item.quantity);
          const stock = ingressStock(prod, item, movement.originType === "A Pedido");
          const newPhysical = stock.stockPhysical;

          await ProductModel.findOneAndUpdate(
            { id: item.productId },
            { $set: stock }
          );

          await KardexModel.create({
            productId: item.productId,
            date: new Date().toISOString().split("T")[0],
            type: "Ingreso",
            quantity: qty,
            reason: `Ingreso Aceptado ${movement.id} (${movement.originType}) - OP: ${movement.opId || "S/OP"}`,
            documentRef: movement.opId || movement.orderId || movement.id,
            balance: newPhysical
          });
        }
      }
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

export const createSalidaMovement = async (req, res, next) => {
  try {
    const movement = await salidaService.create(req.body);
    res.json({ success: true, movement });
  } catch (err) {
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
          const qty = Number(item.quantity);
          const stock = ingressStock(prod, item, resolvedOriginType === "A Pedido");
          const newPhysical = stock.stockPhysical;

          await ProductModel.findOneAndUpdate(
            { id: item.productId },
            { $set: stock }
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

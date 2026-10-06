import WarehouseMovementModel from "../models/WarehouseMovement.js";
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

export const acceptWarehouseMovement = async (req, res, next) => {
  try {
    const { movementId } = req.body;
    const movement = await WarehouseMovementModel.findOne({ id: movementId });
    if (!movement) {
      return res.status(404).json({ success: false, message: "Movimiento de almacén no encontrado" });
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
          const qty = item.quantity || 0;
          const newPhysical = (prod.stockPhysical || 0) + qty;
          const newCommitted = movement.originType === "A Pedido"
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
            reason: `Ingreso Aceptado ${movement.id} (${movement.originType}) - OP: ${movement.opId || "S/OP"}`,
            documentRef: movement.opId || movement.orderId || movement.id,
            balance: newPhysical
          });
        }
      }
    } else if (movement.type === "Salida") {
      // Salida: descuenta Stock Físico y Stock Comprometido (global y por tallas)
      for (const item of movement.items) {
        const prod = await ProductModel.findOne({ id: item.productId });
        if (prod) {
          const qty = item.quantity || 0;
          const newPhysical = Math.max(0, (prod.stockPhysical || 0) - qty);
          const newCommitted = Math.max(0, (prod.stockCommitted || 0) - qty);

          const updatedSizes = prod.sizes ? { ...prod.sizes } : {};
          const size = item.selectedSize || "M";
          if (updatedSizes[size]) {
            const szPhys = Number(updatedSizes[size].stockPhysical) || 0;
            const szComm = Number(updatedSizes[size].stockCommitted) || 0;
            updatedSizes[size] = {
              ...updatedSizes[size],
              stockPhysical: Math.max(0, szPhys - qty),
              stockCommitted: Math.max(0, szComm - qty)
            };
          }

          await ProductModel.findOneAndUpdate(
            { id: item.productId },
            { 
              $set: { 
                stockPhysical: newPhysical, 
                stockCommitted: newCommitted,
                sizes: updatedSizes
              } 
            }
          );

          await KardexModel.create({
            productId: item.productId,
            date: new Date().toISOString().split("T")[0],
            type: "Salida",
            quantity: qty,
            reason: `Salida Aceptada ${movement.id} (${movement.originType}) - ${movement.orderId ? `Orden ${movement.orderId}` : movement.opId ? `OP ${movement.opId}` : "Almacén"} [Talla: ${size}]`,
            documentRef: movement.orderId || movement.opId || movement.id,
            balance: newPhysical
          });
        }
      }

      // Mark order as warehouse approved so Sales can activate the "Despachar" button
      if (movement.orderId) {
        await OrderModel.findOneAndUpdate(
          { id: movement.orderId },
          { 
            $set: { 
              salidaApproved: true, 
              warehouseApproved: true,
              warehouseStatus: "Salida Aprobada",
              warehouseSalidaId: movement.id,
              warehouseApprovedAt: new Date().toISOString()
            } 
          }
        );
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
    const { orderId, opId, items, originType: customOriginType, reason, notes, autoAccept } = req.body;
    
    let targetOrder = null;
    let targetOp = null;

    if (orderId) {
      targetOrder = await OrderModel.findOne({ id: orderId });
    }
    if (opId) {
      targetOp = await ProductionOrderModel.findOne({ id: opId });
      if (!targetOrder && targetOp?.orderId) {
        targetOrder = await OrderModel.findOne({ id: targetOp.orderId });
      }
    }

    // VALIDATION: If linked to an OP or custom order, verify warehouse stock received
    let relatedOp = targetOp;
    if (!relatedOp && targetOrder) {
      relatedOp = await ProductionOrderModel.findOne({ orderId: targetOrder.id });
    }

    if (relatedOp || (targetOrder && targetOrder.type === "pedido")) {
      const orderIdentifier = targetOrder?.id;
      const opIdentifier = relatedOp?.id;

      // Find all accepted ingress movements for this order or OP
      const acceptedIngresos = await WarehouseMovementModel.find({
        type: "Ingreso",
        status: "Aceptado",
        $or: [
          ...(opIdentifier ? [{ opId: opIdentifier }] : []),
          ...(orderIdentifier ? [{ orderId: orderIdentifier }] : [])
        ]
      });

      const totalIngressedUnits = acceptedIngresos.reduce((sum, wm) => {
        const itemSum = (wm.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
        return sum + (itemSum || Number(wm.quantity) || 0);
      }, 0);

      // Find all accepted salida movements for this order or OP
      const existingSalidas = await WarehouseMovementModel.find({
        type: "Salida",
        status: "Aceptado",
        $or: [
          ...(opIdentifier ? [{ opId: opIdentifier }] : []),
          ...(orderIdentifier ? [{ orderId: orderIdentifier }] : [])
        ]
      });

      const totalDispatchedUnits = existingSalidas.reduce((sum, wm) => {
        const itemSum = (wm.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
        return sum + (itemSum || Number(wm.quantity) || 0);
      }, 0);

      const availableInWarehouse = Math.max(0, totalIngressedUnits - totalDispatchedUnits);

      if (totalIngressedUnits === 0) {
        return res.status(400).json({
          success: false,
          message: `No se puede generar la salida: Aún no se ha recibido ningún ingreso aceptado en almacén para la orden ${targetOrder?.id || relatedOp?.id}.`
        });
      }

      if (availableInWarehouse <= 0) {
        return res.status(400).json({
          success: false,
          message: `No hay saldo físico en almacén para la orden ${targetOrder?.id || relatedOp?.id}. Todo lo ingresado (${totalIngressedUnits} uds) ya fue despachado previamente.`
        });
      }
    }

    let itemsToProcess = [];
    if (items && Array.isArray(items) && items.length > 0) {
      itemsToProcess = items;
    } else if (targetOrder && targetOrder.items) {
      itemsToProcess = targetOrder.items.map((i) => ({
        productId: i.productId,
        productName: i.productName || "Prenda",
        quantity: i.quantity || 1,
        selectedSize: i.selectedSize
      }));
    } else if (targetOp && targetOp.items) {
      itemsToProcess = targetOp.items.map((i) => ({
        productId: i.productId,
        productName: i.productName || "Prenda",
        quantity: (i.quantityOrdered || 0) + (i.quantityExtras || 0) || 1,
        selectedSize: i.selectedSize
      }));
    }

    if (itemsToProcess.length === 0) {
      return res.status(400).json({ success: false, message: "No se especificaron prendas para la salida." });
    }

    const movementId = `S-${(Math.floor(Math.random() * 900) + 100).toString()}`;
    const isPedido = (targetOrder && targetOrder.type === "pedido") || (targetOp && targetOp.orderId);
    const resolvedOriginType = customOriginType || (isPedido ? "A Pedido" : (targetOrder ? "Venta Directa" : (targetOp ? "Producción OP" : "Ajuste / Merma")));

    const newSalida = await WarehouseMovementModel.create({
      id: movementId,
      type: "Salida",
      originType: resolvedOriginType,
      status: autoAccept ? "Aceptado" : "Pendiente",
      orderId: targetOrder?.id || orderId || null,
      opId: targetOp?.id || opId || null,
      items: itemsToProcess,
      reason: reason || `Salida por ${resolvedOriginType}`,
      notes: notes || "",
      date: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      processedAt: autoAccept ? new Date().toISOString() : null
    });

    if (autoAccept) {
      // Deduct stock and register Kardex
      for (const item of itemsToProcess) {
        const prod = await ProductModel.findOne({ id: item.productId });
        if (prod) {
          const qty = item.quantity || 0;
          const newPhysical = Math.max(0, (prod.stockPhysical || 0) - qty);
          const newCommitted = Math.max(0, (prod.stockCommitted || 0) - qty);

          await ProductModel.findOneAndUpdate(
            { id: item.productId },
            { $set: { stockPhysical: newPhysical, stockCommitted: newCommitted } }
          );

          await KardexModel.create({
            productId: item.productId,
            date: new Date().toISOString().split("T")[0],
            type: "Salida",
            quantity: qty,
            reason: `Salida Aceptada ${movementId} (${resolvedOriginType}) - ${targetOrder?.id ? `Orden ${targetOrder.id}` : targetOp?.id ? `OP ${targetOp.id}` : "Almacén"}`,
            documentRef: targetOrder?.id || targetOp?.id || movementId,
            balance: newPhysical
          });
        }
      }

      if (targetOrder) {
        await OrderModel.findOneAndUpdate(
          { id: targetOrder.id },
          { 
            $set: { 
              salidaApproved: true, 
              warehouseApproved: true,
              warehouseStatus: "Salida Aprobada",
              warehouseSalidaId: movementId,
              warehouseApprovedAt: new Date().toISOString()
            } 
          }
        );
      }
    }

    res.json({ success: true, movement: newSalida });
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

      itemsToProcess = targetOp.items.map((i) => {
        const totalItemQty = (Number(i.quantityOrdered) || 0) + (Number(i.quantityExtras) || 0) || 1;
        const remainingQty = Math.max(1, totalItemQty - alreadyIngressedQty);
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

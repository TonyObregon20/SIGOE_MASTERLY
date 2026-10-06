import ProductionOrderModel from "../models/ProductionOrder.js";
import WarehouseMovementModel from "../models/WarehouseMovement.js";
import SupplierModel from "../models/Supplier.js";

const STAGES_LIST = [
  "Tendido",
  "Corte",
  "Costura",
  "Limpieza",
  "Planchado y Empaquetado"
];

export const getProductionOrders = async (req, res, next) => {
  try {
    const list = await ProductionOrderModel.find().sort({ _id: -1 });
    const normalized = list.map((doc) => {
      const op = doc.toObject ? doc.toObject() : { ...doc };
      if (op.stages && Array.isArray(op.stages) && op.stages.length === 5) {
        const hasLegacy = op.stages.some(s => s.name === "Acabado" || s.name === "Empaquetado");
        if (hasLegacy) {
          op.stages = op.stages.map((s, idx) => ({
            ...s,
            name: STAGES_LIST[idx] || s.name
          }));
          if (op.currentStage === "Corte") {
            op.currentStage = "Tendido";
          }
        }
      }
      return op;
    });
    res.json(normalized);
  } catch (err) {
    next(err);
  }
};

export const createProductionOrder = async (req, res, next) => {
  try {
    const productionOrder = req.body;
    // Prevent duplicates if already created for this order
    if (productionOrder.orderId) {
      const existing = await ProductionOrderModel.findOne({ orderId: productionOrder.orderId });
      if (existing) {
        return res.json({ success: true, productionOrder: existing });
      }
    }
    const created = await ProductionOrderModel.create(productionOrder);
    res.json({ success: true, productionOrder: created });
  } catch (err) {
    next(err);
  }
};

export const updateStage = async (req, res, next) => {
  try {
    const { opId, stageName, status, responsible, currentStage, progress, stages, supplierId, sublots } = req.body;
    
    // Update OP stages, sublots & progress directly
    const updateData = { stages, progress, currentStage };
    if (sublots !== undefined) {
      updateData.sublots = sublots;
    }

    const updatedOp = await ProductionOrderModel.findOneAndUpdate(
      { id: opId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedOp) {
      return res.status(404).json({ success: false, message: "OP no encontrada" });
    }

    // Immediately respond to client for maximum UI speed and responsiveness
    res.json({ success: true, productionOrder: updatedOp });

    // If stage was completed, handle supplier metrics recording asynchronously in the background
    if (status === "completed") {
      setImmediate(async () => {
        try {
          let supplier = null;
          if (supplierId) {
            supplier = await SupplierModel.findOne({
              $or: [
                { _id: typeof supplierId === "string" && supplierId.match(/^[0-9a-fA-F]{24}$/) ? supplierId : null },
                { id: supplierId }
              ]
            });
          }
          if (!supplier && responsible && responsible !== "Operario de Tendido" && !responsible.toLowerCase().startsWith("operario")) {
            supplier = await SupplierModel.findOne({ name: responsible });
          }

          if (supplier) {
            const totalUnits = (updatedOp.items || []).reduce((sum, item) => {
              return sum + (Number(item.quantityOrdered) || 0) + (Number(item.quantityExtras) || 0);
            }, 0);

            const existingRecord = (supplier.history || []).find(
              (h) => h.reference === opId && (h.specialty === stageName || h.description?.includes(stageName))
            );

            if (!existingRecord) {
              const unitCost = Number(supplier.unitCostRate) || 0;
              const totalCost = unitCost * totalUnits;
              const newRecord = {
                id: "REC-" + Date.now(),
                date: new Date().toISOString().split("T")[0],
                type: "Servicio",
                specialty: supplier.specialty || stageName,
                reference: opId,
                description: `Servicio de ${stageName} - Lote ${opId} (${totalUnits} prendas)`,
                quantity: totalUnits,
                unit: "prendas",
                unitCost,
                totalCost,
                status: "Completado"
              };

              if (!Array.isArray(supplier.history)) {
                supplier.history = [];
              }
              supplier.history.unshift(newRecord);
              supplier.servicesCount = (Number(supplier.servicesCount) || 0) + 1;
              supplier.totalUnitsProcessed = (Number(supplier.totalUnitsProcessed) || 0) + totalUnits;
              supplier.totalSpent = (Number(supplier.totalSpent) || 0) + totalCost;
              await supplier.save();
            }
          }
        } catch (supplierErr) {
          console.error("Error updating supplier metrics on stage completion:", supplierErr);
        }
      });
    }
  } catch (err) {
    next(err);
  }
};


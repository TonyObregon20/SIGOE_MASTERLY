import { SupplierModel } from "../models/Supplier.js";

// Helper to normalize and compute metrics
function normalizeSupplierData(supplier) {
  const isService = supplier.specialty !== "Insumos" && supplier.type !== "Insumos";
  const history = Array.isArray(supplier.history) ? supplier.history : [];
  
  // Calculate from history if history exists
  let servicesCount = supplier.servicesCount || 0;
  let totalUnitsProcessed = supplier.totalUnitsProcessed || 0;
  let purchasesCount = supplier.purchasesCount || 0;
  let totalUnitsPurchased = supplier.totalUnitsPurchased || 0;
  let totalSpent = supplier.totalSpent || 0;

  if (history.length > 0) {
    if (isService) {
      servicesCount = history.filter(h => h.type === "Servicio").length;
      totalUnitsProcessed = history.filter(h => h.type === "Servicio").reduce((sum, h) => sum + (Number(h.quantity) || 0), 0);
    } else {
      purchasesCount = history.filter(h => h.type === "Compra").length;
      totalUnitsPurchased = history.filter(h => h.type === "Compra").reduce((sum, h) => sum + (Number(h.quantity) || 0), 0);
    }
    totalSpent = history.reduce((sum, h) => sum + (Number(h.totalCost) || 0), 0);
  }

  return {
    ...supplier.toObject ? supplier.toObject() : supplier,
    type: isService ? "Servicio" : "Insumos",
    specialty: supplier.specialty || (supplier.category === "Telas" || supplier.category === "Insumos" ? "Insumos" : "Costura"),
    servicesCount,
    totalUnitsProcessed,
    purchasesCount,
    totalUnitsPurchased,
    totalSpent,
    history
  };
}

export const getSuppliers = async (req, res, next) => {
  try {
    const list = await SupplierModel.find().sort({ createdAt: -1 });
    const normalized = list.map(normalizeSupplierData);
    res.json(normalized);
  } catch (err) {
    next(err);
  }
};

export const createSupplier = async (req, res, next) => {
  try {
    const data = req.body;
    
    // Auto-assign type based on specialty
    const isService = data.specialty && data.specialty !== "Insumos";
    const type = isService ? "Servicio" : "Insumos";
    
    const supplierId = data.id || `PROV-${Date.now().toString().slice(-4)}`;

    const newSupplier = await SupplierModel.create({
      ...data,
      id: supplierId,
      type,
      specialty: data.specialty || (isService ? "Costura" : "Insumos"),
      category: data.specialty || (isService ? "Costura" : "Insumos"),
      status: data.status || "Activo",
      servicesCount: Number(data.servicesCount) || 0,
      totalUnitsProcessed: Number(data.totalUnitsProcessed) || 0,
      purchasesCount: Number(data.purchasesCount) || 0,
      totalUnitsPurchased: Number(data.totalUnitsPurchased) || 0,
      totalSpent: Number(data.totalSpent) || 0,
      history: Array.isArray(data.history) ? data.history : []
    });

    res.json({ success: true, supplier: normalizeSupplierData(newSupplier) });
  } catch (err) {
    next(err);
  }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.specialty) {
      updateData.type = updateData.specialty === "Insumos" ? "Insumos" : "Servicio";
      updateData.category = updateData.specialty;
    }

    const updated = await SupplierModel.findOneAndUpdate(
      { $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { id }] },
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Proveedor no encontrado" });
    }

    res.json({ success: true, supplier: normalizeSupplierData(updated) });
  } catch (err) {
    next(err);
  }
};

export const deleteSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await SupplierModel.findOneAndDelete({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { id }]
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Proveedor no encontrado" });
    }

    res.json({ success: true, message: "Proveedor eliminado correctamente" });
  } catch (err) {
    next(err);
  }
};

// Add a service or purchase record to a supplier
export const addSupplierRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, type, reference, description, quantity, unit, unitCost, totalCost, notes, status } = req.body;

    const supplier = await SupplierModel.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { id }]
    });

    if (!supplier) {
      return res.status(404).json({ success: false, message: "Proveedor no encontrado" });
    }

    const qty = Number(quantity) || 0;
    const uCost = Number(unitCost) || 0;
    const totCost = Number(totalCost) || (qty * uCost);
    const recordType = type || (supplier.specialty === "Insumos" ? "Compra" : "Servicio");

    const newRecord = {
      id: "REC-" + Date.now(),
      date: date || new Date().toISOString().split("T")[0],
      type: recordType,
      specialty: supplier.specialty,
      reference: reference || "",
      description: description || (recordType === "Servicio" ? `Servicio de ${supplier.specialty}` : `Compra de ${supplier.insumoDetails || 'Insumos'}`),
      quantity: qty,
      unit: unit || (recordType === "Servicio" ? "prendas" : "unidades"),
      unitCost: uCost,
      totalCost: totCost,
      status: status || "Completado",
      notes: notes || ""
    };

    if (!Array.isArray(supplier.history)) {
      supplier.history = [];
    }
    supplier.history.unshift(newRecord);

    if (recordType === "Servicio") {
      supplier.servicesCount = (Number(supplier.servicesCount) || 0) + 1;
      supplier.totalUnitsProcessed = (Number(supplier.totalUnitsProcessed) || 0) + qty;
    } else {
      supplier.purchasesCount = (Number(supplier.purchasesCount) || 0) + 1;
      supplier.totalUnitsPurchased = (Number(supplier.totalUnitsPurchased) || 0) + qty;
    }
    supplier.totalSpent = (Number(supplier.totalSpent) || 0) + totCost;

    await supplier.save();

    res.json({ success: true, supplier: normalizeSupplierData(supplier), record: newRecord });
  } catch (err) {
    next(err);
  }
};

// Delete a service or purchase record
export const deleteSupplierRecord = async (req, res, next) => {
  try {
    const { id, recordId } = req.params;

    const supplier = await SupplierModel.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { id }]
    });

    if (!supplier) {
      return res.status(404).json({ success: false, message: "Proveedor no encontrado" });
    }

    if (Array.isArray(supplier.history)) {
      supplier.history = supplier.history.filter(r => r.id !== recordId);
      
      // Recalculate
      const isService = supplier.specialty !== "Insumos";
      if (isService) {
        supplier.servicesCount = supplier.history.filter(h => h.type === "Servicio").length;
        supplier.totalUnitsProcessed = supplier.history.filter(h => h.type === "Servicio").reduce((sum, h) => sum + (Number(h.quantity) || 0), 0);
      } else {
        supplier.purchasesCount = supplier.history.filter(h => h.type === "Compra").length;
        supplier.totalUnitsPurchased = supplier.history.filter(h => h.type === "Compra").reduce((sum, h) => sum + (Number(h.quantity) || 0), 0);
      }
      supplier.totalSpent = supplier.history.reduce((sum, h) => sum + (Number(h.totalCost) || 0), 0);
      
      await supplier.save();
    }

    res.json({ success: true, supplier: normalizeSupplierData(supplier) });
  } catch (err) {
    next(err);
  }
};

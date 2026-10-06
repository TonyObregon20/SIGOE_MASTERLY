import mongoose from "mongoose";

const SupplierRecordSchema = new mongoose.Schema({
  id: { type: String, default: () => "REC-" + Date.now() },
  date: { type: String, default: () => new Date().toISOString().split("T")[0] },
  type: { type: String, enum: ["Servicio", "Compra"], default: "Servicio" }, // Servicio brindado o Compra de insumos
  specialty: { type: String }, // Corte, Costura, Limpieza, Planchado, Empaquetado, Insumos
  reference: { type: String }, // ej: OP-102, Lote 45, Factura F001-23
  description: { type: String },
  quantity: { type: Number, default: 0 }, // prendas procesadas o unidades de insumos
  unit: { type: String, default: "unidades" }, // prendas, docenas, millares, metros, etc.
  unitCost: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  status: { type: String, default: "Completado" }, // Pendiente, En Proceso, Completado
  notes: { type: String }
}, { _id: false });

const SupplierSchema = new mongoose.Schema({
  id: { type: String, default: () => "PROV-" + Date.now().toString().slice(-6) },
  name: { type: String, required: true },
  documentType: { type: String, default: "RUC" }, // RUC, DNI
  documentNumber: { type: String, default: "" },
  contact: { type: String, default: "" },
  phone: { type: String, default: "" },
  email: { type: String, default: "" },
  address: { type: String, default: "" },
  
  // Tipo principal: 'Servicio' (Corte, Costura, etc.) o 'Insumos'
  type: { type: String, enum: ["Servicio", "Insumos"], default: "Servicio" },
  
  // Característica / Especialidad:
  // Corte, Costura, Limpieza, Planchado, Empaquetado, Insumos
  specialty: { 
    type: String, 
    enum: ["Corte", "Costura", "Limpieza", "Planchado", "Empaquetado", "Insumos"], 
    default: "Costura" 
  },
  category: { type: String, default: "Costura" }, // retrocompatibilidad

  // Para Insumos: collarines, espaldar, agujas, hilos, botones, etc.
  insumoDetails: { type: String, default: "" },

  // Tarifa referencial estimada (por prenda/servicio o por insumo)
  unitCostRate: { type: Number, default: 0 },

  status: { type: String, enum: ["Activo", "Inactivo"], default: "Activo" },
  notes: { type: String, default: "" },

  // Métricas de control
  // Para Servicios:
  servicesCount: { type: Number, default: 0 }, // Cuántas veces / pedidos nos ha brindado servicio
  totalUnitsProcessed: { type: Number, default: 0 }, // Total prendas procesadas

  // Para Insumos:
  purchasesCount: { type: Number, default: 0 }, // Cuántas compras le hemos hecho
  totalUnitsPurchased: { type: Number, default: 0 }, // Cuánto de insumos le hemos comprado

  // Total acumulado económico
  totalSpent: { type: Number, default: 0 },

  // Historial detallado de servicios y compras
  history: [SupplierRecordSchema]
}, { strict: false, timestamps: true });

export const SupplierModel = mongoose.models.Supplier || mongoose.model("Supplier", SupplierSchema);
export const Supplier = SupplierModel;
export default SupplierModel;

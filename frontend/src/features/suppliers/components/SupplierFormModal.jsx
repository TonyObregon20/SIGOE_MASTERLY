import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  Scissors,
  Layers,
  Sparkles,
  Flame,
  Package,
  Tags,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  User,
  DollarSign
} from "lucide-react";
import { motion } from "motion/react";
import { SUPPLIER_SPECIALTIES } from "../suppliersUtils";

const SPECIALTY_META = {
  Corte: {
    label: "Corte",
    type: "Servicio",
    desc: "Servicio de tendido y corte de piezas textiles",
    icon: Scissors,
    color: "border-amber-500 bg-amber-50 text-amber-700"
  },
  Costura: {
    label: "Costura",
    type: "Servicio",
    desc: "Servicio de confección, armado y costura de prendas (Tercerización)",
    icon: Layers,
    color: "border-blue-500 bg-blue-50 text-blue-700"
  },
  Limpieza: {
    label: "Limpieza",
    type: "Servicio",
    desc: "Servicio de deshilachado, limpieza y control de calidad",
    icon: Sparkles,
    color: "border-teal-500 bg-teal-50 text-teal-700"
  },
  Planchado: {
    label: "Planchado",
    type: "Servicio",
    desc: "Servicio de planchado industrial al vapor y hormado",
    icon: Flame,
    color: "border-purple-500 bg-purple-50 text-purple-700"
  },
  Empaquetado: {
    label: "Empaquetado",
    type: "Servicio",
    desc: "Servicio de doblado, embolsado y encajonado de prendas",
    icon: Package,
    color: "border-indigo-500 bg-indigo-50 text-indigo-700"
  },
  Insumos: {
    label: "Insumos",
    type: "Insumos",
    desc: "Suministro de collarines, espaldar, agujas, hilos, botones y avíos",
    icon: Tags,
    color: "border-emerald-500 bg-emerald-50 text-emerald-700"
  }
};

export default function SupplierFormModal({ isOpen, onClose, onSave, supplierToEdit }) {
  const isEditing = Boolean(supplierToEdit);

  const [formData, setFormData] = useState({
    name: "",
    documentType: "RUC",
    documentNumber: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
    specialty: "Costura",
    type: "Servicio",
    insumoDetails: "",
    unitCostRate: "",
    status: "Activo",
    notes: ""
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (supplierToEdit) {
      setFormData({
        name: supplierToEdit.name || "",
        documentType: supplierToEdit.documentType || "RUC",
        documentNumber: supplierToEdit.documentNumber || "",
        contact: supplierToEdit.contact || "",
        phone: supplierToEdit.phone || "",
        email: supplierToEdit.email || "",
        address: supplierToEdit.address || "",
        specialty: supplierToEdit.specialty || (supplierToEdit.category === "Telas" ? "Insumos" : supplierToEdit.category || "Costura"),
        type: supplierToEdit.specialty === "Insumos" ? "Insumos" : "Servicio",
        insumoDetails: supplierToEdit.insumoDetails || "",
        unitCostRate: supplierToEdit.unitCostRate || "",
        status: supplierToEdit.status || "Activo",
        notes: supplierToEdit.notes || ""
      });
    } else {
      setFormData({
        name: "",
        documentType: "RUC",
        documentNumber: "",
        contact: "",
        phone: "",
        email: "",
        address: "",
        specialty: "Costura",
        type: "Servicio",
        insumoDetails: "",
        unitCostRate: "",
        status: "Activo",
        notes: ""
      });
    }
    setError("");
  }, [supplierToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSpecialtyChange = (spec) => {
    const isService = spec !== "Insumos";
    setFormData((prev) => ({
      ...prev,
      specialty: spec,
      type: isService ? "Servicio" : "Insumos"
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Por favor ingresa el nombre o razón social del proveedor.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await onSave({
        ...formData,
        unitCostRate: formData.unitCostRate ? Number(formData.unitCostRate) : 0
      });
      onClose();
    } catch (err) {
      setError(err.message || "Error al guardar proveedor");
    } finally {
      setSubmitting(false);
    }
  };

  const currentMeta = SPECIALTY_META[formData.specialty] || SPECIALTY_META["Costura"];
  const isServiceType = formData.specialty !== "Insumos";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">
                {isEditing ? "Editar Proveedor" : "Registrar Nuevo Proveedor"}
              </h3>
              <p className="text-xs text-slate-400 font-serif italic">
                {isEditing
                  ? `Modificando datos de: ${supplierToEdit.name}`
                  : "Clasificación por servicio de taller o suministro de insumos"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Selector de Característica / Especialidad */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
              <span>Característica / Especialidad *</span>
              <span className="text-[10px] text-blue-600 font-medium">
                {isServiceType ? "⚡ Proveedor de Servicio (Tercerizado)" : "📦 Proveedor de Insumos Físicos"}
              </span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {SUPPLIER_SPECIALTIES.map((spec) => {
                const meta = SPECIALTY_META[spec] || SPECIALTY_META["Costura"];
                const Icon = meta.icon;
                const isSelected = formData.specialty === spec;
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => handleSpecialtyChange(spec)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? `${meta.color} ring-2 ring-blue-500/20 shadow-sm font-semibold`
                        : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-bold">{meta.label}</span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 line-clamp-1">
                      {meta.type === "Servicio" ? "Servicio Taller" : "Materiales / Avíos"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Hint Box */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2">
              <currentMeta.icon className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-800">{currentMeta.label}:</span>{" "}
                <span className="text-slate-600">{currentMeta.desc}</span>
              </div>
            </div>
          </div>

          {/* 2. Datos Generales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Nombre / Razón Social *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={isServiceType ? "Ej: Taller de Costura Santa Rosa" : "Ej: Distribuidora de Insumos & Avíos Textiles"}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Document Type & Number */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Tipo de Documento
              </label>
              <select
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="RUC">RUC (Empresa / Persona con Negocio)</option>
                <option value="DNI">DNI (Persona Natural)</option>
                <option value="Otro">Otro Documento</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Número de Documento
              </label>
              <input
                type="text"
                value={formData.documentNumber}
                onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                placeholder={formData.documentType === "RUC" ? "Ej: 20601234567" : "Ej: 45892134"}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Contact Person & Phone */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Persona de Contacto
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="Ej: Sra. Rosa Huamán / Don Carlos"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Teléfono / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ej: +51 984 512 873"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Email & Address */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contacto@proveedor.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Activo">Activo (Disponible)</option>
                <option value="Inactivo">Inactivo / Pausado</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Dirección / Ubicación del Taller o Local
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Ej: Jr. Huánuco 1420 - Taller 3B, La Victoria, Lima"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 3. Campos condicionales según Servicio vs Insumos */}
          {formData.specialty === "Insumos" ? (
            <div className="space-y-1.5 p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl">
              <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Tags className="w-4 h-4 text-emerald-600" />
                Insumos que suministra *
              </label>
              <input
                type="text"
                value={formData.insumoDetails}
                onChange={(e) => setFormData({ ...formData, insumoDetails: e.target.value })}
                placeholder="Ej: Collarines (rib), espaldas reforzadas, agujas industriales DBx1, botones, hilos..."
                className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
              <p className="text-[11px] text-emerald-700">
                Especifica los insumos que provee para facilitar la búsqueda y el control de compras.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 p-4 bg-blue-50/50 border border-blue-200 rounded-xl">
              <label className="text-[11px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-blue-600" />
                Tarifa o Costo Referencial por Prenda / Servicio (S/)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-400">S/</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitCostRate}
                  onChange={(e) => setFormData({ ...formData, unitCostRate: e.target.value })}
                  placeholder="Ej: 4.50"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-blue-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
                />
              </div>
              <p className="text-[11px] text-blue-700">
                Costo estimado que cobra este taller por procesar una prenda en la etapa de{" "}
                <strong>{formData.specialty}</strong>.
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Notas / Observaciones
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Capacidad del taller, maquinaria disponible, plazos habituales de entrega..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              {submitting ? "Guardando..." : isEditing ? "Actualizar Proveedor" : "Guardar Proveedor"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

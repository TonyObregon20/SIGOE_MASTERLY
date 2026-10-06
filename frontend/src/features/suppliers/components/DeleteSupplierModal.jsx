import React, { useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { motion } from "motion/react";

export default function DeleteSupplierModal({ isOpen, onClose, onConfirm, supplier }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !supplier) return null;

  const handleConfirm = async () => {
    try {
      setDeleting(true);
      setError("");
      await onConfirm(supplier.id || supplier._id);
      onClose();
    } catch (err) {
      setError(err.message || "Error al eliminar proveedor");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 p-6 text-slate-800 space-y-4"
      >
        <div className="flex items-center gap-3 text-red-600">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">¿Eliminar Proveedor?</h3>
            <p className="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
            {error}
          </div>
        )}

        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
          <p className="font-bold text-slate-800">{supplier.name}</p>
          <p className="text-slate-500 font-mono text-[11px]">
            Especialidad: {supplier.specialty} • RUC/DNI: {supplier.documentNumber || "No especificado"}
          </p>
          {supplier.servicesCount > 0 && (
            <p className="text-amber-600 font-medium text-[11px]">
              ⚠️ Este proveedor tiene {supplier.servicesCount} servicio(s) registrados.
            </p>
          )}
          {supplier.purchasesCount > 0 && (
            <p className="text-amber-600 font-medium text-[11px]">
              ⚠️ Este proveedor tiene {supplier.purchasesCount} compra(s) registradas.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-500/20 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deleting ? "Eliminando..." : "Sí, Eliminar"}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

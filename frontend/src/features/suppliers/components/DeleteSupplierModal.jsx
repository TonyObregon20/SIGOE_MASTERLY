import AdminDialog from "@/components/admin/AdminDialog";
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
    <AdminDialog label="Eliminar proveedor" onClose={onClose} className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-shop-ink/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md bg-white rounded-[2px] overflow-y-auto border border-shop-line p-6 text-shop-ink space-y-4 max-h-[90dvh]"
      >
        <div className="flex items-center gap-3 text-red-600">
          <div className="w-12 h-12 rounded-[2px] bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-medium text-shop-ink">¿Eliminar Proveedor?</h3>
            <p className="text-xs text-shop-muted">Esta acción no se puede deshacer.</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-[2px] text-xs text-red-600">
            {error}
          </div>
        )}

        <div className="p-3.5 bg-shop-light rounded-[2px] border border-shop-line text-xs space-y-1">
          <p className="font-medium text-shop-ink">{supplier.name}</p>
          <p className="text-shop-muted tabular-nums text-[11px]">
            Especialidad: {supplier.specialty} • RUC/DNI: {supplier.documentNumber || "No especificado"}
          </p>
          {supplier.servicesCount > 0 && (
            <p className="text-amber-600 font-medium text-[11px]">
              Este proveedor tiene {supplier.servicesCount} servicio(s) registrados.
            </p>
          )}
          {supplier.purchasesCount > 0 && (
            <p className="text-amber-600 font-medium text-[11px]">
              Este proveedor tiene {supplier.purchasesCount} compra(s) registradas.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-[2px] border border-shop-line text-shop-muted hover:bg-shop-light text-xs font-medium transition-all min-h-9"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-[2px] text-xs font-medium transition-all flex items-center gap-1.5 min-h-9"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deleting ? "Eliminando..." : "Sí, Eliminar"}</span>
          </button>
        </div>
      </motion.div>
    </AdminDialog>
  );
}

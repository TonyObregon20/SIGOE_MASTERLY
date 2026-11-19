import AdminDialog from "@/components/admin/AdminDialog";
import React from "react";
import { Package, Plus, X, FileText } from "lucide-react";
import { motion } from "motion/react";

/**
 * Modal to register income of finished products to inventory
 */
export default function IncomeStockModal({
  isOpen,
  onClose,
  products = [],
  incomeItems = [],
  tempProductId = "",
  setTempProductId,
  tempQuantity = 10,
  setTempQuantity,
  onAddItem,
  onRemoveItem,
  onSubmit
}) {
  if (!isOpen) return null;

  return (
    <AdminDialog label="Agregar stock" onClose={onClose} className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-shop-ink/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-[2px] overflow-y-auto border border-shop-line max-h-[90dvh]"
      >
        <div className="p-8 space-y-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-shop-ink tracking-tight">
                Ingreso de Producción
              </h3>
              <p className="text-[11px] font-medium text-shop-muted">
                Entrada de prendas terminadas a almacén
              </p>
            </div>
            <button aria-label="Cerrar ventana"
              type="button"
              onClick={onClose}
              className="p-2 bg-shop-light text-shop-muted rounded-[2px] hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 bg-shop-light/50 p-5 rounded-[2px] border border-shop-line">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-shop-muted pl-1">
                Agregar Prenda o Modelo
              </label>
              <div className="flex gap-2">
                <select
                  value={tempProductId}
                  onChange={(e) => setTempProductId(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white border border-shop-line rounded-[2px] outline-none font-medium text-shop-muted focus:ring-2 focus:ring-shop-blue/20 min-h-10 min-w-0 text-base sm:text-[13px]"
                >
                  <option value="" disabled>
                    Seleccione modelo...
                  </option>
                  {products.map((p, idx) => (
                    <option key={p._id || p.id || `opt-${idx}`} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={tempQuantity}
                  onChange={(e) => setTempQuantity(Number(e.target.value))}
                  min="1"
                  className="w-24 px-4 py-2 bg-white border border-shop-line rounded-[2px] outline-none tabular-nums font-semibold focus:ring-2 focus:ring-shop-blue/20 min-h-10 min-w-0 text-base sm:text-[13px]"
                />
                <button
                  type="button"
                  onClick={onAddItem}
                  className="p-2.5 bg-shop-ink text-white rounded-[2px] hover:bg-shop-ink transition-all"
                >
                  <Plus className="w-5 h-5 hover:rotate-90 transition-transform" />
                </button>
              </div>
            </div>

            {incomeItems.length > 0 ? (
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-shop-muted pl-1">
                  Prendas a Ingresar
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {incomeItems.map((item, idx) => {
                    const product = products.find((p) => p.id === item.productId);
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white px-4 py-3 rounded-[2px] border border-shop-line border-l-4 border-l-blue-500"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-shop-ink truncate">
                            {product?.name}
                          </p>
                          <p className="text-[11px] text-shop-blue font-medium">
                            Cant: {item.quantity} Uds
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(idx)}
                          className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center border-2 border-dashed border-shop-line rounded-[2px]">
                <p className="text-[11px] font-medium text-slate-300 tabular-nums">
                  Agregue prendas de la lista
                </p>
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-shop-muted pl-1">
                  Ubicación (Almacén)
                </label>
                <input
                  name="location"
                  placeholder="Ejem: ESTANTE-1"
                  className="w-full px-4 py-3 bg-white border border-shop-line rounded-[2px] outline-none font-medium focus:ring-2 focus:ring-shop-blue/20 min-h-10 min-w-0 text-base sm:text-[13px]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-shop-muted pl-1">
                  Nro Parte / Guía
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-shop-muted" />
                  <input
                    name="docRef"
                    placeholder="PIN-001"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-shop-line rounded-[2px] outline-none tabular-nums focus:ring-2 focus:ring-shop-blue/20 min-h-10 min-w-0 text-base sm:text-[13px]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-shop-muted pl-1">
                Taller de Origen / Motivo
              </label>
              <input
                name="reason"
                placeholder="Ejem: Ingreso del Taller de Costura o Lote #XX"
                required
                className="w-full px-4 py-3 bg-white border border-shop-line rounded-[2px] outline-none font-medium focus:ring-2 focus:ring-shop-blue/20 min-h-10 min-w-0 text-base sm:text-[13px]"
              />
            </div>

            <button
              type="submit"
              disabled={incomeItems.length === 0}
              className={`w-full py-4 text-white font-semibold rounded-[2px] transition-all flex items-center justify-center gap-2 ${
                incomeItems.length > 0
                  ? "bg-shop-ink hover:bg-shop-ink"
                  : "bg-slate-300 cursor-not-allowed text-shop-muted"
              }`}
            >
              <Package className="w-5 h-5" /> Confirmar Ingreso al Inventario
            </button>
          </form>
        </div>
      </motion.div>
    </AdminDialog>
  );
}

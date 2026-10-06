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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
      >
        <div className="p-8 space-y-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                Ingreso de Producción
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Entrada de prendas terminadas a almacén
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <X className="w-5 h-5 animate-pulse" />
            </button>
          </div>

          <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-200 shadow-inner">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                Agregar Prenda o Modelo
              </label>
              <div className="flex gap-2">
                <select
                  value={tempProductId}
                  onChange={(e) => setTempProductId(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20"
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
                  className="w-24 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none font-mono font-black focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={onAddItem}
                  className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200 active:scale-90"
                >
                  <Plus className="w-5 h-5 hover:rotate-90 transition-transform" />
                </button>
              </div>
            </div>

            {incomeItems.length > 0 ? (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                  Prendas a Ingresar
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {incomeItems.map((item, idx) => {
                    const product = products.find((p) => p.id === item.productId);
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 uppercase truncate">
                            {product?.name}
                          </p>
                          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">
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
              <div className="py-8 text-center border-2 border-dashed border-slate-150 rounded-xl">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono">
                  Agregue prendas de la lista
                </p>
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                  Ubicación (Almacén)
                </label>
                <input
                  name="location"
                  placeholder="Ejem: ESTANTE-1"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none font-bold uppercase focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                  Nro Parte / Guía
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="docRef"
                    placeholder="PIN-001"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none font-mono focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                Taller de Origen / Motivo
              </label>
              <input
                name="reason"
                placeholder="Ejem: Ingreso del Taller de Costura o Lote #XX"
                required
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none font-medium focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={incomeItems.length === 0}
              className={`w-full py-4 text-white font-black uppercase tracking-widest rounded-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
                incomeItems.length > 0
                  ? "bg-slate-950 hover:bg-blue-600"
                  : "bg-slate-300 cursor-not-allowed text-slate-500 shadow-none"
              }`}
            >
              <Package className="w-5 h-5 animate-bounce" /> Confirmar Ingreso al Inventario
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

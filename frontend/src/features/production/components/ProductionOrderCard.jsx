import React from "react";
import { Package, Clock, FileText, Plus, ChevronRight, CheckCircle2, SlidersHorizontal, X, Layers } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getStatusColor } from "../productionUtils";
import StageManager from "./StageManager";

/**
 * Card representing a Production Order with lot items, extras editor, and stage workflow
 */
export default function ProductionOrderCard({
  op,
  products = [],
  salesOrders = [],
  warehouseMovements = [],
  onOpenGenerateIngreso,
  isSelected = false,
  onToggleSelect,
  showProductSelector,
  setShowProductSelector,
  onAddExtraProduct,
  onUpdateExtras,
  onUpdateStage,
  suppliers = []
}) {
  const firstItem = op.items?.[0];
  const product = products.find((p) => p.id === firstItem?.productId);
  const salesOrder = op.orderId ? salesOrders.find((o) => o.id === op.orderId) : null;

  const isFinished = op.currentStage === "Finalizado" || (op.progress || 0) >= 100;
  const existingIngreso = (warehouseMovements || []).find(
    (wm) => wm.opId === op.id && wm.type === "Ingreso"
  );
  const isIngresoAccepted = Boolean(existingIngreso && existingIngreso.status === "Aceptado");
  const isIngresoPending = Boolean(existingIngreso && existingIngreso.status === "Pendiente");

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-blue-500">
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex gap-4">
            <div className="w-14 h-16 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden group">
              {product ? (
                <img
                  src={product.image}
                  alt={product.name || "Prenda"}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <span className="text-[10px] font-black uppercase leading-none font-mono">OP</span>
                  <span className="text-lg font-bold leading-tight text-slate-700">
                    {op.id?.split("-")[1] || op.id}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                Fabricación Lote {op.id}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                {op.orderId && !op.orderId.includes("AUTO") ? (
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 w-fit">
                      <FileText className="w-3 h-3" /> {op.orderId}
                    </span>
                    {salesOrder && (
                      <span className="text-[10px] font-black text-slate-650 uppercase">
                        Cliente: {salesOrder.customerName}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 w-fit font-bold font-mono tracking-wider">
                      <Package className="w-3 h-3 text-amber-600 animate-pulse" /> AUTOSTOCK
                    </span>
                  </div>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {op.startDate}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="text-slate-650 italic font-sans lowercase font-normal">
                  {op.items?.length || 0} modelos en proceso
                </span>
              </div>
            </div>
          </div>
          <div className="text-right space-y-1">
            <div
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                op.currentStage === "Finalizado"
                  ? "bg-emerald-100 text-emerald-700 font-mono"
                  : "bg-blue-100 text-blue-700 font-mono"
              }`}
            >
              {op.currentStage}
            </div>
            <div className="text-2xl font-black text-slate-900 leading-none tracking-tighter">
              {Math.round(op.progress || 0)}%
            </div>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="relative h-1 w-full bg-slate-100 rounded-full mb-12 mt-4">
          <div
            className="absolute h-full bg-blue-600 rounded-full transition-all duration-700"
            style={{ width: `${op.progress || 0}%` }}
          />
          <div className="absolute -top-1.5 inset-x-0 flex justify-between">
            {op.stages?.map((s) => (
              <div key={s.name} className="flex flex-col items-center relative">
                <div
                  className={`w-4 h-4 rounded-full border-4 border-white shadow-sm transition-colors ${getStatusColor(
                    s.status
                  )}`}
                />
                <span className="absolute top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-tight text-slate-400 text-center whitespace-nowrap">
                  {s.name}
                </span>
              </div>
            ))}
            <div className="flex flex-col items-center relative">
              <div
                className={`w-4 h-4 rounded-full border-4 border-white shadow-sm transition-colors ${
                  op.currentStage === "Finalizado" ? "bg-emerald-500" : "bg-slate-200"
                }`}
              />
              <span
                className={`absolute top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-tight ${
                  op.currentStage === "Finalizado" ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                Fin
              </span>
            </div>
          </div>
        </div>

        {/* Items and Extras in OP */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Contenido de la Producción / Extras
            </p>
            <button
              onClick={() => setShowProductSelector(showProductSelector ? null : op.id)}
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:text-blue-700 transition-colors"
            >
              <Plus className="w-3 h-3" /> Añadir otro modelo como extra
            </button>
          </div>

          {showProductSelector && (
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 grid grid-cols-2 md:grid-cols-4 gap-2 animate-in fade-in slide-in-from-top-2">
              {products.map((p, idx) => (
                <button
                  key={p._id || p.id || `sel-p-${idx}`}
                  onClick={() => onAddExtraProduct(op.id, p)}
                  className="bg-white p-2 rounded border border-slate-200 text-left hover:border-blue-400 transition-all group"
                >
                  <p className="text-[10px] font-bold text-slate-900 group-hover:text-blue-600 truncate">
                    {p.name}
                  </p>
                  <p className="text-[8px] font-medium text-slate-400 uppercase tracking-wider">
                    Añadir como extra
                  </p>
                </button>
              ))}
            </div>
          )}

          {op.items?.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100"
            >
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">{item.productName}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Pedido Clientes: {item.quantityOrdered} uds
                </p>
                {item.selectedSize && (
                  <span className="inline-block mt-1 text-[8px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-150">
                    Talla: {item.selectedSize}
                  </span>
                )}
                {item.sizeDistribution && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(item.sizeDistribution).map(
                      ([sz, qty]) =>
                        qty > 0 && (
                          <span
                            key={sz}
                            className="text-[8px] font-bold bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-650"
                          >
                            Talla {sz}: {qty}
                          </span>
                        )
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Extras Almacén
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={item.quantityExtras || 0}
                      onChange={(e) => onUpdateExtras(op.id, item.productId, Number(e.target.value))}
                      className="w-16 px-2 py-1 text-xs font-black bg-white border border-slate-200 rounded focus:ring-2 focus:ring-blue-500/20 outline-none font-mono"
                    />
                    <span className="text-[10px] font-bold text-slate-400">UDS</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                    Total Producción
                  </p>
                  <p className="text-lg font-black text-emerald-700 font-mono">
                    {(item.quantityOrdered || 0) + (item.quantityExtras || 0)} uds
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {isFinished && !existingIngreso && (
              <button
                type="button"
                onClick={() => onOpenGenerateIngreso?.(op.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-md shadow-emerald-600/20 font-mono"
              >
                <Package className="w-3.5 h-3.5" /> Generar Ingreso con OP
              </button>
            )}

            {isFinished && isIngresoPending && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" /> Ingreso Pendiente en Almacén ({existingIngreso.id})
              </span>
            )}

            {isFinished && isIngresoAccepted && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Ingreso Aceptado en Almacén ({existingIngreso.id})
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleSelect}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md shadow-slate-900/10 hover:shadow-lg font-mono cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
            <span>Gestión Interfaz</span>
          </button>
        </div>
      </div>

      {/* Modal de Gestión Interfaz (Fases y Tercerizados) */}
      <AnimatePresence>
        {isSelected && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            {/* Backdrop con blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggleSelect}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            {/* Modal Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-7xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 z-10 my-auto max-h-[92vh] flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                        Gestión Interfaz — Flujo de Fases
                      </h3>
                      <span className="text-[10px] font-bold bg-blue-500/30 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full font-mono">
                        Lote {op.id}
                      </span>
                      {op.orderId && !op.orderId.includes("AUTO") && (
                        <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                          Orden {op.orderId}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Asigna tercerizados / operarios y controla el avance de cada etapa de fabricación.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block font-mono">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                      Progreso Global
                    </span>
                    <span className="text-sm font-black text-blue-400">
                      {Math.round(op.progress || 0)}% — {op.currentStage}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleSelect}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Cerrar modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Stage Manager */}
              <div className="overflow-y-auto flex-1 bg-slate-50 p-2 sm:p-4">
                <StageManager op={op} updateStage={onUpdateStage} suppliers={suppliers} isModal={true} />
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
                <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                  ⚡ Las etapas y los estados se actualizan en vivo de forma instantánea.
                </span>
                <button
                  type="button"
                  onClick={onToggleSelect}
                  className="ml-auto px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer font-mono"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

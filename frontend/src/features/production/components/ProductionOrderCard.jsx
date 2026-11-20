import AdminDialog from "@/components/admin/AdminDialog";
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
    <div className="bg-white rounded-[2px] border border-shop-line overflow-hidden transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex gap-4">
            <div className="w-14 h-16 bg-shop-light border border-shop-line rounded-[2px] overflow-hidden group">
              {product ? (
                <img
                  src={product.image}
                  alt={product.name || "Prenda"}
                  className="w-full h-full object-cover transition-transform"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-shop-muted">
                  <span className="text-[11px] font-semibold leading-none tabular-nums">OP</span>
                  <span className="text-lg font-medium leading-tight text-shop-muted">
                    {op.id?.split("-")[1] || op.id}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-medium text-shop-ink tracking-tight">
                Fabricación Lote {op.id}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-shop-muted tabular-nums">
                {op.orderId && !op.orderId.includes("AUTO") ? (
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1 bg-shop-light text-shop-blue px-2 py-0.5 rounded-[2px] border border-shop-light w-fit">
                      <FileText className="w-3 h-3" /> {op.orderId}
                    </span>
                    {salesOrder && (
                      <span className="text-[11px] font-semibold text-shop-muted">
                        Cliente: {salesOrder.customerName}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-[2px] border border-amber-200 w-fit font-medium tabular-nums">
                      <Package className="w-3 h-3 text-amber-600" /> AUTOSTOCK
                    </span>
                  </div>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {op.startDate}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="text-shop-muted font-shop lowercase font-normal">
                  {op.items?.length || 0} modelos en proceso
                </span>
              </div>
            </div>
          </div>
          <div className="text-right space-y-1">
            <div
              className={`px-2 py-0.5 rounded-[2px] text-[11px] font-medium ${
                op.currentStage === "Finalizado"
                  ? "bg-emerald-100 text-emerald-700 tabular-nums"
                  : "bg-shop-light text-shop-blue tabular-nums"
              }`}
            >
              {op.currentStage}
            </div>
            <div className="text-2xl font-semibold text-shop-ink leading-none tracking-tighter">
              {Math.round(op.progress || 0)}%
            </div>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="relative h-1 w-full bg-shop-light rounded-full mb-12 mt-4">
          <div
            className="absolute h-full bg-shop-ink rounded-full transition-all duration-700"
            style={{ width: `${op.progress || 0}%` }}
          />
          <div className="absolute -top-1.5 inset-x-0 flex justify-between">
            {op.stages?.map((s) => (
              <div key={s.name} className="flex flex-col items-center relative">
                <div
                  className={`w-4 h-4 rounded-full border-4 border-white transition-colors ${getStatusColor(
                    s.status
                  )}`}
                />
                <span className="absolute top-5 left-1/2 -translate-x-1/2 text-[11px] font-medium tracking-tight text-shop-muted text-center whitespace-nowrap">
                  {s.name}
                </span>
              </div>
            ))}
            <div className="flex flex-col items-center relative">
              <div
                className={`w-4 h-4 rounded-full border-4 border-white transition-colors ${
                  op.currentStage === "Finalizado" ? "bg-emerald-500" : "bg-slate-200"
                }`}
              />
              <span
                className={`absolute top-5 left-1/2 -translate-x-1/2 text-[11px] font-medium tracking-tight ${
                  op.currentStage === "Finalizado" ? "text-emerald-600" : "text-shop-muted"
                }`}
              >
                Fin
              </span>
            </div>
          </div>
        </div>

        {/* Items and Extras in OP */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between border-b border-shop-line pb-2">
            <p className="text-[11px] font-semibold text-shop-muted">
              Contenido de la Producción / Extras
            </p>
            <button
              onClick={() => setShowProductSelector(showProductSelector ? null : op.id)}
              className="text-[11px] font-semibold text-shop-blue flex items-center gap-1 hover:text-shop-blue transition-colors"
            >
              <Plus className="w-3 h-3" /> Añadir otro modelo como extra
            </button>
          </div>

          {showProductSelector && (
            <div className="bg-shop-light/50 p-4 rounded-[2px] border border-shop-light grid grid-cols-2 md:grid-cols-4 gap-2 fade-in slide-in-from-top-2">
              {products.map((p, idx) => (
                <button
                  key={p._id || p.id || `sel-p-${idx}`}
                  onClick={() => onAddExtraProduct(op.id, p)}
                  className="bg-white p-2 rounded-[2px] border border-shop-line text-left hover:border-blue-400 transition-all group"
                >
                  <p className="text-[11px] font-medium text-shop-ink group-hover:text-shop-blue truncate">
                    {p.name}
                  </p>
                  <p className="text-[11px] font-medium text-shop-muted">
                    Añadir como extra
                  </p>
                </button>
              ))}
            </div>
          )}

          {op.items?.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-shop-light p-4 rounded-[2px] border border-shop-line"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-shop-ink">{item.productName}</p>
                <p className="text-[11px] font-medium text-shop-muted">
                  Pedido Clientes: {item.quantityOrdered} uds
                </p>
                {item.selectedSize && (
                  <span className="inline-block mt-1 text-[11px] font-semibold bg-shop-light text-shop-blue px-1.5 py-0.5 rounded-[2px] border border-blue-150">
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
                            className="text-[11px] font-medium bg-white border border-shop-line px-1.5 py-0.5 rounded-[2px] text-shop-muted"
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
                  <label className="text-[11px] font-semibold text-shop-muted">
                    Extras Almacén
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={item.quantityExtras || 0}
                      onChange={(e) => onUpdateExtras(op.id, item.productId, Number(e.target.value))}
                      className="w-16 px-2 py-1 font-semibold bg-white border border-shop-line rounded-[2px] focus:ring-2 focus:ring-shop-blue/20 outline-none tabular-nums min-h-10 min-w-0 text-base sm:text-[13px]"
                    />
                    <span className="text-[11px] font-medium text-shop-muted">UDS</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold text-emerald-600">
                    Total Producción
                  </p>
                  <p className="text-lg font-semibold text-emerald-700 tabular-nums">
                    {(item.quantityOrdered || 0) + (item.quantityExtras || 0)} uds
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-shop-line">
          <div className="flex flex-wrap items-center gap-2">
            {isFinished && !existingIngreso && (
              <button
                type="button"
                onClick={() => onOpenGenerateIngreso?.(op.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-shop-ink hover:bg-shop-blue text-white rounded-[2px] text-xs font-semibold transition-all tabular-nums min-h-9"
              >
                <Package className="w-3.5 h-3.5" /> Generar Ingreso con OP
              </button>
            )}

            {isFinished && isIngresoPending && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-[2px] text-[11px] font-medium tabular-nums">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> Ingreso Pendiente en Almacén ({existingIngreso.id})
              </span>
            )}

            {isFinished && isIngresoAccepted && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-[2px] text-[11px] font-medium tabular-nums">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Ingreso Aceptado en Almacén ({existingIngreso.id})
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleSelect}
            className="flex items-center gap-2 px-5 py-2.5 bg-shop-ink hover:bg-shop-ink text-white rounded-[2px] text-xs font-medium transition-all tabular-nums cursor-pointer min-h-9"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
            <span>Gestionar etapas</span>
          </button>
        </div>
      </div>

      {/* Modal de Gestionar etapas (Fases y Tercerizados) */}
      <AnimatePresence>
        {isSelected && (
          <AdminDialog label="Gestionar etapas de producción" onClose={onToggleSelect} className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            {/* Backdrop con blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggleSelect}
              className="fixed inset-0 bg-shop-ink/70 backdrop-blur-sm"
            />

            {/* Modal Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-7xl bg-white rounded-[2px] overflow-y-auto border border-shop-line z-10 my-auto max-h-[92vh] flex flex-col max-h-[90dvh]"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-shop-ink text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[2px] bg-shop-ink/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-white tabular-nums">
                        Gestionar etapas — Flujo de Fases
                      </h3>
                      <span className="text-[11px] font-medium bg-shop-ink/30 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full tabular-nums">
                        Lote {op.id}
                      </span>
                      {op.orderId && !op.orderId.includes("AUTO") && (
                        <span className="text-[11px] font-medium bg-shop-ink text-slate-300 px-2 py-0.5 rounded-full tabular-nums">
                          Orden {op.orderId}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Asigna tercerizados / operarios y controla el avance de cada etapa de fabricación.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block tabular-nums">
                    <span className="text-[11px] font-medium text-slate-300 block">
                      Progreso Global
                    </span>
                    <span className="text-sm font-semibold text-blue-400">
                      {Math.round(op.progress || 0)}% — {op.currentStage}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleSelect}
                    className="p-2 text-slate-300 hover:text-white hover:bg-shop-ink rounded-[2px] transition-colors cursor-pointer"
                    title="Cerrar modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Stage Manager */}
              <div className="overflow-y-auto flex-1 bg-shop-light p-2 sm:p-4">
                <StageManager op={op} updateStage={onUpdateStage} suppliers={suppliers} isModal={true} />
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-white border-t border-shop-line flex items-center justify-between text-xs text-shop-muted shrink-0">
                <span className="text-[11px] tabular-nums text-shop-muted hidden sm:inline">
                  Las etapas y los estados se actualizan en vivo de forma instantánea.
                </span>
                <button
                  type="button"
                  onClick={onToggleSelect}
                  className="ml-auto px-5 py-2 bg-shop-ink hover:bg-shop-ink text-white rounded-[2px] text-xs font-medium transition-colors cursor-pointer tabular-nums min-h-9"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </AdminDialog>
        )}
      </AnimatePresence>
    </div>
  );
}

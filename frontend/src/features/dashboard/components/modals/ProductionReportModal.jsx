import AdminDialog from "@/components/admin/AdminDialog";
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ClipboardList,
  X,
  TrendingUp,
  FileText,
  Clock,
  AlertCircle,
  Package,
  Plus,
  Download
} from "lucide-react";
import { generateProductionPDF } from "../../utils/dashPdfGenerator";
import { generateProductionExcel } from "../../utils/dashExcelGenerator";

/**
 * Modal to display comprehensive production, stages, sizes, and stock analytics
 */
export default function ProductionReportModal({
  isOpen,
  onClose,
  productionMetrics,
  lowStock = [],
  calculateReplenishQty,
  getSizeDistribution,
  onGenerateAutoOP,
  onCreateIndividualOP
}) {
  const [reportTab, setReportTab] = useState("overview");

  if (!isOpen) return null;

  const {
    totalOPs = 0,
    activeOPsCount = 0,
    finishedOPsCount = 0,
    totalUnitsInProcess = 0,
    totalUnitsCompleted = 0,
    totalProductionUnits = 0,
    stageUnits = {},
    stageStats = {},
    sizeTally = {}
  } = productionMetrics || {};

  const handleDownloadPDF = () => {
    generateProductionPDF({
      totalOPs,
      activeOPsCount,
      finishedOPsCount,
      totalUnitsInProcess,
      totalUnitsCompleted,
      totalProductionUnits,
      stageUnits,
      stageStats,
      sizeTally,
      lowStock,
      calculateReplenishQty
    });
  };

  const handleDownloadExcel = () => {
    generateProductionExcel({
      totalOPs,
      activeOPsCount,
      finishedOPsCount,
      totalUnitsInProcess,
      totalUnitsCompleted,
      totalProductionUnits,
      stageUnits,
      stageStats,
      sizeTally,
      lowStock,
      calculateReplenishQty
    });
  };

  return (
    <AnimatePresence>
      <AdminDialog label="Reporte de producción" onClose={onClose} className="fixed inset-0 z-[130] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-shop-ink/60 backdrop-blur-xs"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-[2px] border border-shop-line w-full max-w-3xl overflow-y-auto z-[140] flex flex-col max-h-[85vh] max-h-[90dvh]"
        >
          {/* Modal Header */}
          <div className="bg-shop-light border-b border-shop-line p-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-shop-light text-shop-blue p-1.5 rounded-[2px]">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-shop-ink text-lg">Reporte de Operaciones y Producción</h3>
                <p className="text-xs text-shop-muted tabular-nums">Tendido, Corte, Costura, Limpieza, Planchado y Empaquetado</p>
              </div>
            </div>
            <button aria-label="Cerrar ventana"
              onClick={onClose}
              className="p-1.5 rounded-[2px] text-shop-muted hover:bg-slate-200 hover:text-shop-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Tabs */}
          <div className="flex border-b border-shop-line bg-shop-light/50 px-4 text-xs font-medium text-shop-muted overflow-x-auto">
            {[
              { id: "overview", label: "Resumen General", icon: TrendingUp },
              { id: "sizes", label: "Tallas y Distribución", icon: FileText },
              { id: "stages", label: "Carga por Etapas", icon: Clock },
              { id: "inventory", label: "Stock Crítico", icon: AlertCircle }
            ].map((t) => {
              const Icon = t.icon;
              const active = reportTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setReportTab(t.id)}
                  className={`flex items-center gap-1.5 py-3 px-4 border-b-2 transition-all shrink-0 ${
                    active
                      ? "border-shop-line text-shop-blue bg-white rounded-t-lg"
                      : "border-transparent hover:text-shop-ink hover:border-slate-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {reportTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-shop-light p-4 rounded-[2px] border border-shop-line">
                    <div className="text-[11px] font-semibold text-shop-muted tabular-nums mb-1">
                      Total OPs
                    </div>
                    <div className="text-2xl font-semibold text-shop-ink tabular-nums">{totalOPs}</div>
                    <div className="text-[11px] text-shop-muted mt-1">Registradas</div>
                  </div>
                  <div className="bg-indigo-55/30 p-4 rounded-[2px] border border-shop-light">
                    <div className="text-[11px] font-semibold text-shop-blue tabular-nums mb-1">
                      OPs Activas
                    </div>
                    <div className="text-2xl font-semibold text-shop-blue tabular-nums">{activeOPsCount}</div>
                    <div className="text-[11px] text-shop-blue mt-1">En taller</div>
                  </div>
                  <div className="bg-emerald-55/30 p-4 rounded-[2px] border border-emerald-100">
                    <div className="text-[11px] font-semibold text-emerald-600 tabular-nums mb-1">
                      Finalizadas
                    </div>
                    <div className="text-2xl font-semibold text-emerald-700 tabular-nums">{finishedOPsCount}</div>
                    <div className="text-[11px] text-emerald-600 mt-1">Listas en almacén</div>
                  </div>
                  <div className="bg-amber-55/30 p-4 rounded-[2px] border border-amber-100">
                    <div className="text-[11px] font-semibold text-amber-600 tabular-nums mb-1">
                      Alertas Stock
                    </div>
                    <div className="text-2xl font-semibold text-amber-700 tabular-nums">{lowStock.length}</div>
                    <div className="text-[11px] text-amber-600 mt-1">Necesitan OP</div>
                  </div>
                </div>

                <div className="bg-shop-light p-5 rounded-[2px] border border-shop-light flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-shop-blue tabular-nums">
                      Volumen Total de Producción
                    </div>
                    <div className="text-3xl font-semibold text-shop-ink tabular-nums">
                      {totalProductionUnits} <span className="text-sm font-normal text-shop-muted">unidades producidas</span>
                    </div>
                    <p className="text-xs text-shop-muted">
                      {totalUnitsInProcess} unidades se encuentran actualmente en taller de confección y {totalUnitsCompleted} unidades han sido completadas históricamente.
                    </p>
                  </div>
                  <div className="w-full md:w-fit bg-white p-3 rounded-[2px] border border-shop-light/50 flex gap-4 text-center tabular-nums text-xs shrink-0">
                    <div>
                      <span className="block font-medium text-shop-muted">EN PROCESO</span>
                      <span className="text-base font-semibold text-shop-blue">+{totalUnitsInProcess}</span>
                    </div>
                    <div className="border-l border-shop-line" />
                    <div>
                      <span className="block font-medium text-shop-muted">COMPLETADO</span>
                      <span className="text-base font-semibold text-emerald-600">+{totalUnitsCompleted}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {reportTab === "sizes" && (
              <div className="space-y-6">
                <h4 className="text-xs font-semibold text-shop-muted tabular-nums">
                  Volumen total por tallas
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(sizeTally).map(([sz, qty]) => (
                    <div key={sz} className="bg-shop-light p-4 rounded-[2px] border border-shop-line flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-shop-ink">Talla {sz}</span>
                        <span className="text-[11px] bg-slate-200 px-1.5 py-0.5 rounded-[2px] tabular-nums font-medium text-shop-muted">
                          {totalProductionUnits > 0 ? `${Math.round((qty / totalProductionUnits) * 100)}%` : "0%"}
                        </span>
                      </div>
                      <div className="mt-4">
                        <span className="text-2xl font-semibold text-shop-blue tabular-nums">{qty}</span>
                        <span className="text-[11px] font-medium text-shop-muted ml-1">uds</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-shop-light/50 rounded-[2px] border border-shop-light text-xs text-shop-muted leading-relaxed">
                  ℹ️ <strong>Nota de Distribución:</strong> Las cantidades por tallas representan tanto las órdenes solicitadas por clientes a pedido de venta directa, como los lotes generados automáticamente para autostockeo en base al algoritmo de demanda estimada.
                </div>
              </div>
            )}

            {reportTab === "stages" && (
              <div className="space-y-6">
                <h4 className="text-xs font-semibold text-shop-muted tabular-nums">
                  Distribución de carga de trabajo por etapa de confección
                </h4>
                <div className="space-y-4">
                  {[
                    { name: "Tendido", bg: "bg-blue-500" },
                    { name: "Corte", bg: "bg-indigo-600" },
                    { name: "Costura", bg: "bg-purple-600" },
                    { name: "Limpieza", bg: "bg-pink-600" },
                    { name: "Planchado y Empaquetado", bg: "bg-teal-600" },
                    { name: "Finalizado", bg: "bg-emerald-600" }
                  ].map((stg) => {
                    const count = stageUnits[stg.name] || 0;
                    const opCount = stageStats[stg.name] || 0;
                    const pct = totalProductionUnits > 0 ? (count / totalProductionUnits) * 100 : 0;
                    return (
                      <div key={stg.name} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-shop-muted">{stg.name}</span>
                            {opCount > 0 && (
                              <span className="text-[11px] bg-shop-light text-shop-muted border border-shop-line px-1.5 py-0.2 rounded-[2px] tabular-nums font-medium">
                                {opCount} {opCount === 1 ? "OP" : "OPs"}
                              </span>
                            )}
                          </div>
                          <div className="tabular-nums text-shop-ink">
                            <span className="font-semibold">{count}</span>{" "}
                            <span className="text-[11px] font-medium text-shop-muted">uds</span>
                          </div>
                        </div>
                        <div className="w-full bg-shop-light rounded-full h-2.5 overflow-hidden border border-shop-line">
                          <div className={`${stg.bg} h-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {reportTab === "inventory" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-semibold text-shop-muted tabular-nums">
                    Alertas críticas e inventario mínimo
                  </h4>
                  {onGenerateAutoOP && (
                    <button
                      onClick={onGenerateAutoOP}
                      disabled={lowStock.length === 0}
                      className="text-[11px] font-semibold bg-red-650 hover:bg-red-700 disabled:bg-slate-200 disabled:text-shop-muted disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-[2px] border border-red-700/20 flex items-center gap-1.5 transition-all min-h-9"
                    >
                      <Package className="w-3.5 h-3.5" /> Autostock General
                    </button>
                  )}
                </div>
                {lowStock.length === 0 ? (
                  <div className="text-center py-8 bg-shop-light rounded-[2px] border border-shop-line text-xs text-shop-muted">
                    ✨ ¡Excelente! No hay productos con stock por debajo del mínimo de seguridad.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lowStock.map((p) => {
                      const replenish = calculateReplenishQty(p);
                      return (
                        <div
                          key={p.id}
                          className="p-4 bg-red-55/20 border border-red-100 rounded-[2px] flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="font-medium text-sm text-shop-ink truncate">{p.name}</div>
                            <div className="text-[11px] text-shop-muted tabular-nums flex flex-wrap gap-x-3 gap-y-1">
                              <span>
                                Mínimo: <strong>{p.minStock} uds</strong>
                              </span>
                              <span>
                                Disponible real:{" "}
                                <strong className="text-red-600">
                                  {p.stockPhysical - p.stockCommitted} uds
                                </strong>
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                            <div className="text-right tabular-nums">
                              <div className="text-xs font-medium text-shop-muted">SUGERIDO</div>
                              <div className="text-sm font-semibold text-red-600">+{replenish} uds</div>
                            </div>
                            {onCreateIndividualOP && (
                              <button
                                onClick={() => onCreateIndividualOP(p)}
                                className="bg-white hover:bg-shop-light text-shop-muted border border-slate-250 p-2 rounded-[2px] text-xs font-medium flex items-center gap-1 transition-transform"
                              >
                                <Plus className="w-3.5 h-3.5 text-shop-blue" /> Crear OP
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="bg-shop-light border-t border-shop-line p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
              <button
                onClick={handleDownloadExcel}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-shop-ink hover:bg-shop-blue text-white font-medium text-xs px-4 py-2.5 rounded-[2px] border border-emerald-700/20 transition-all cursor-pointer min-h-9"
              >
                <Download className="w-4 h-4" /> Descargar Excel
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-shop-ink hover:bg-shop-ink text-white font-medium text-xs px-4 py-2.5 rounded-[2px] border border-shop-line/20 transition-all cursor-pointer min-h-9"
              >
                <FileText className="w-4 h-4" /> Descargar PDF
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-full sm:w-auto bg-white hover:bg-shop-light text-shop-muted border border-slate-300 font-medium text-xs px-6 py-2.5 rounded-[2px] transition-transform cursor-pointer min-h-9"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </AdminDialog>
    </AnimatePresence>
  );
}

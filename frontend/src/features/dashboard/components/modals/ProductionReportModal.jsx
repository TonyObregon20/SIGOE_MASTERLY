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
      <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden z-[140] flex flex-col max-h-[85vh]"
        >
          {/* Modal Header */}
          <div className="bg-slate-50 border-b border-slate-200 p-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 text-blue-700 p-1.5 rounded-lg">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Reporte de Operaciones y Producción</h3>
                <p className="text-xs text-slate-500 font-mono">Tendido, Corte, Costura, Limpieza, Planchado y Empaquetado</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/50 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 overflow-x-auto">
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
                      ? "border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-xs"
                      : "border-transparent hover:text-slate-850 hover:border-slate-300"
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
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 font-mono mb-1">
                      Total OPs
                    </div>
                    <div className="text-2xl font-black text-slate-850 font-mono">{totalOPs}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Registradas</div>
                  </div>
                  <div className="bg-indigo-55/30 p-4 rounded-xl border border-indigo-100">
                    <div className="text-[9px] font-black uppercase tracking-widest text-indigo-500 font-mono mb-1">
                      OPs Activas
                    </div>
                    <div className="text-2xl font-black text-indigo-700 font-mono">{activeOPsCount}</div>
                    <div className="text-[10px] text-indigo-600 mt-1">En taller</div>
                  </div>
                  <div className="bg-emerald-55/30 p-4 rounded-xl border border-emerald-100">
                    <div className="text-[9px] font-black uppercase tracking-widest text-emerald-600 font-mono mb-1">
                      Finalizadas
                    </div>
                    <div className="text-2xl font-black text-emerald-700 font-mono">{finishedOPsCount}</div>
                    <div className="text-[10px] text-emerald-600 mt-1">Listas en almacén</div>
                  </div>
                  <div className="bg-amber-55/30 p-4 rounded-xl border border-amber-100">
                    <div className="text-[9px] font-black uppercase tracking-widest text-amber-600 font-mono mb-1">
                      Alertas Stock
                    </div>
                    <div className="text-2xl font-black text-amber-700 font-mono">{lowStock.length}</div>
                    <div className="text-[10px] text-amber-600 mt-1">Necesitan OP</div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-black text-blue-600 uppercase tracking-wider font-mono">
                      Volumen Total de Producción
                    </div>
                    <div className="text-3xl font-black text-slate-850 font-mono">
                      {totalProductionUnits} <span className="text-sm font-normal text-slate-500">unidades producidas</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {totalUnitsInProcess} unidades se encuentran actualmente en taller de confección y {totalUnitsCompleted} unidades han sido completadas históricamente.
                    </p>
                  </div>
                  <div className="w-full md:w-fit bg-white p-3 rounded-xl border border-blue-100/50 flex gap-4 text-center font-mono text-xs shrink-0">
                    <div>
                      <span className="block font-bold text-slate-400">EN PROCESO</span>
                      <span className="text-base font-black text-blue-600">+{totalUnitsInProcess}</span>
                    </div>
                    <div className="border-l border-slate-200" />
                    <div>
                      <span className="block font-bold text-slate-400">COMPLETADO</span>
                      <span className="text-base font-black text-emerald-600">+{totalUnitsCompleted}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {reportTab === "sizes" && (
              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono">
                  Volumen total por tallas
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(sizeTally).map(([sz, qty]) => (
                    <div key={sz} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-slate-800">Talla {sz}</span>
                        <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-mono font-bold text-slate-600">
                          {totalProductionUnits > 0 ? `${Math.round((qty / totalProductionUnits) * 100)}%` : "0%"}
                        </span>
                      </div>
                      <div className="mt-4">
                        <span className="text-2xl font-black text-blue-700 font-mono">{qty}</span>
                        <span className="text-[10px] font-bold text-slate-400 ml-1">uds</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-slate-600 leading-relaxed">
                  ℹ️ <strong>Nota de Distribución:</strong> Las cantidades por tallas representan tanto las órdenes solicitadas por clientes a pedido de venta directa, como los lotes generados automáticamente para autostockeo en base al algoritmo de demanda estimada.
                </div>
              </div>
            )}

            {reportTab === "stages" && (
              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono">
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
                            <span className="font-bold text-slate-700">{stg.name}</span>
                            {opCount > 0 && (
                              <span className="text-[9px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.2 rounded font-mono font-bold">
                                {opCount} {opCount === 1 ? "OP" : "OPs"}
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-slate-800">
                            <span className="font-black">{count}</span>{" "}
                            <span className="text-[10px] font-bold text-slate-400">uds</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
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
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono">
                    Alertas críticas e inventario mínimo
                  </h4>
                  {onGenerateAutoOP && (
                    <button
                      onClick={onGenerateAutoOP}
                      disabled={lowStock.length === 0}
                      className="text-[10px] font-black uppercase tracking-wider bg-red-650 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg border border-red-700/20 flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <Package className="w-3.5 h-3.5" /> Autostock General
                    </button>
                  )}
                </div>
                {lowStock.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                    ✨ ¡Excelente! No hay productos con stock por debajo del mínimo de seguridad.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lowStock.map((p) => {
                      const replenish = calculateReplenishQty(p);
                      return (
                        <div
                          key={p.id}
                          className="p-4 bg-red-55/20 border border-red-100 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="font-bold text-sm text-slate-800 truncate">{p.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono flex flex-wrap gap-x-3 gap-y-1">
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
                            <div className="text-right font-mono">
                              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">SUGERIDO</div>
                              <div className="text-sm font-black text-red-600">+{replenish} uds</div>
                            </div>
                            {onCreateIndividualOP && (
                              <button
                                onClick={() => onCreateIndividualOP(p)}
                                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-250 p-2 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1 active:scale-95 transition-transform"
                              >
                                <Plus className="w-3.5 h-3.5 text-blue-600" /> Crear OP
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
          <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
              <button
                onClick={handleDownloadExcel}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl border border-emerald-700/20 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" /> Descargar Excel
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl border border-blue-700/20 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" /> Descargar PDF
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-full sm:w-auto bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-xs active:scale-95 transition-transform cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

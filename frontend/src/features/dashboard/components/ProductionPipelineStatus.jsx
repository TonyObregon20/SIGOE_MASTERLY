import React from "react";

/**
 * Visual distribution of active production orders across the 5 workshop stages
 */
export default function ProductionPipelineStatus({ stageStats }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <h3 className="font-bold text-slate-700 text-xs mb-3 uppercase tracking-wider font-mono">
        Distribución de Órdenes por Etapa
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(stageStats || {}).map(([stage, count]) => (
          <div key={stage} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex flex-col justify-between">
            <span className="text-xs text-slate-500 font-medium">{stage}</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold text-slate-800">{count}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  count > 0 ? "bg-indigo-100 text-indigo-700 font-mono animate-pulse" : "bg-slate-100 text-slate-400"
                }`}
              >
                {count > 0 ? "Activas" : "Vacío"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

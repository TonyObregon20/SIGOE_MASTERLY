import React from "react";

/**
 * Visual distribution of active production orders across the 5 workshop stages
 */
export default function ProductionPipelineStatus({ stageStats }) {
  return (
    <div className="bg-white rounded-[2px] border border-shop-line p-4">
      <h3 className="font-medium text-shop-muted text-xs mb-3 tabular-nums">
        Distribución de Órdenes por Etapa
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Object.entries(stageStats || {}).map(([stage, count]) => (
          <div key={stage} className="p-3 bg-shop-light border border-shop-line rounded-[2px] flex flex-col justify-between">
            <span className="text-xs text-shop-muted font-medium">{stage}</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-medium text-shop-ink">{count}</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${
                  count > 0 ? "bg-shop-light text-shop-blue tabular-nums" : "bg-shop-light text-shop-muted"
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

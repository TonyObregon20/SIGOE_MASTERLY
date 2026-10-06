import React from "react";
import { CheckCircle2, Truck, Plus, Package, FileSpreadsheet } from "lucide-react";
import WarehouseMovementCard from "./WarehouseMovementCard";

/**
 * Section container for managing warehouse movements (Pending, All, Accepted)
 */
export default function WarehouseMovementsSection({
  movements = [],
  filter = "Pendientes",
  onFilterChange,
  pendingCount = 0,
  onAcceptMovement,
  onOpenCreateSalida,
  onOpenCreateIngreso,
  onOpenIncomeStock,
  onOpenReport
}) {
  const handleOpenIngreso = onOpenCreateIngreso || onOpenIncomeStock;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">
              Movimientos de Almacén (Ingresos y Salidas)
            </h3>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full animate-bounce">
                {pendingCount} Pendiente{pendingCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-serif italic">
            Aceptación y verificación del almacenero para actualizar el stock físico y habilitar despachos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenReport && (
            <button
              type="button"
              onClick={onOpenReport}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-md shadow-slate-900/10 active:scale-95 transition-all flex items-center gap-1.5 font-mono"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" /> Generar Reporte
            </button>
          )}

          {handleOpenIngreso && (
            <button
              type="button"
              onClick={handleOpenIngreso}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5" /> Generar Ingreso (OP / Manual)
            </button>
          )}

          {onOpenCreateSalida && (
            <button
              type="button"
              onClick={onOpenCreateSalida}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5" /> Generar Salida (OP / Pedido)
            </button>
          )}

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {["Pendientes", "Todos", "Aceptados"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onFilterChange(tab)}
                className={`px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${
                  filter === tab
                    ? "bg-white text-slate-950 shadow-sm font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {movements.length === 0 ? (
        <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
            No hay movimientos {filter.toLowerCase()} en este momento
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {movements.map((wm) => (
            <WarehouseMovementCard
              key={wm.id}
              movement={wm}
              onAcceptMovement={onAcceptMovement}
            />
          ))}
        </div>
      )}
    </div>
  );
}

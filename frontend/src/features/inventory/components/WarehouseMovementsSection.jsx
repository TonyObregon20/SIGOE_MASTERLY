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
    <div className="bg-white border border-shop-line rounded-[2px] p-6 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-shop-line pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-shop-ink tracking-tight">
              Movimientos de Almacén (Ingresos y Salidas)
            </h3>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-500 text-white text-[11px] font-semibold rounded-full">
                {pendingCount} Pendiente{pendingCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-xs text-shop-muted font-shop">
            Aceptación y verificación del almacenero para actualizar el stock físico y habilitar despachos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenReport && (
            <button
              type="button"
              onClick={onOpenReport}
              className="px-3.5 py-1.5 bg-shop-ink hover:bg-shop-ink text-white text-[11px] font-semibold rounded-[2px] transition-all flex items-center gap-1.5 tabular-nums min-h-9"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" /> Generar Reporte
            </button>
          )}

          {handleOpenIngreso && (
            <button
              type="button"
              onClick={handleOpenIngreso}
              className="px-3.5 py-1.5 bg-shop-ink hover:bg-shop-blue text-white text-[11px] font-semibold rounded-[2px] transition-all flex items-center gap-1.5 min-h-9"
            >
              <Package className="w-3.5 h-3.5" /> Generar Ingreso (OP / Manual)
            </button>
          )}

          {onOpenCreateSalida && (
            <button
              type="button"
              onClick={onOpenCreateSalida}
              className="px-3.5 py-1.5 bg-shop-ink hover:bg-shop-ink text-white text-[11px] font-semibold rounded-[2px] transition-all flex items-center gap-1.5 min-h-9"
            >
              <Truck className="w-3.5 h-3.5" /> Generar Salida (OP / Pedido)
            </button>
          )}

          <div className="flex items-center gap-1 bg-shop-light p-1 rounded-[2px]">
            {["Pendientes", "Todos", "Aceptados"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onFilterChange(tab)}
                className={`px-3 py-1 text-[11px] font-semibold rounded-[2px] transition-all ${
                  filter === tab
                    ? "bg-white text-shop-ink font-medium"
                    : "text-shop-muted hover:text-shop-ink"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {movements.length === 0 ? (
        <div className="py-8 text-center bg-shop-light rounded-[2px] border border-dashed border-shop-line">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
          <p className="text-xs font-medium text-shop-muted tabular-nums">
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

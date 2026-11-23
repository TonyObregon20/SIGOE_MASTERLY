import React from "react";
import { CheckCircle2, Truck, Package, FileSpreadsheet } from "lucide-react";
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
  onConfigureSalida,
  onOpenCreateIngreso,
  onOpenIncomeStock,
  onOpenReport
}) {
  const handleOpenIngreso = onOpenCreateIngreso || onOpenIncomeStock;

  return (
    <div className="bg-white border border-shop-line rounded-[2px] p-4 sm:p-5 space-y-4 min-w-0">
      <div className="space-y-3 border-b border-shop-line pb-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-shop-ink tracking-tight">
              Movimientos de Almacén (Ingresos y Salidas)
            </h3>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-500 text-white text-[11px] font-semibold rounded-full shrink-0">
                {pendingCount} Pendiente{pendingCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-xs text-shop-muted font-shop">
            Aceptación y verificación del almacenero para actualizar el stock físico y habilitar despachos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {handleOpenIngreso && (
            <button
              type="button"
              onClick={handleOpenIngreso}
              className="min-h-10 w-full px-3 py-2 bg-shop-ink hover:bg-shop-blue text-white text-xs font-semibold rounded-[2px] transition-colors flex items-center justify-center gap-2"
            >
              <Package className="w-4 h-4 shrink-0" /> Generar Ingreso (OP / Manual)
            </button>
          )}

          {onOpenCreateSalida && (
            <button
              type="button"
              onClick={onOpenCreateSalida}
              className="min-h-10 w-full px-3 py-2 bg-shop-ink hover:bg-shop-blue text-white text-xs font-semibold rounded-[2px] transition-colors flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4 shrink-0" /> Generar Salida (OP / Pedido)
            </button>
          )}

          {onOpenReport && (
            <button
              type="button"
              onClick={onOpenReport}
              className="min-h-10 w-full px-3 py-2 bg-shop-ink hover:bg-shop-blue text-white text-xs font-semibold rounded-[2px] transition-colors flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" /> Generar Reporte
            </button>
          )}
        </div>
      </div>

      <div aria-label="Filtrar movimientos" className="flex">
        <div className="grid grid-cols-3 w-full sm:w-auto items-center gap-1 bg-shop-light p-1 rounded-[2px] border border-shop-line">
          {["Pendientes", "Todos", "Aceptados"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onFilterChange(tab)}
              aria-pressed={filter === tab}
              className={`min-h-9 px-3 sm:px-4 py-2 text-xs font-semibold rounded-[2px] transition-all ${
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

      {movements.length === 0 ? (
        <div className="py-8 text-center bg-shop-light rounded-[2px] border border-dashed border-shop-line">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
          <p className="text-xs font-medium text-shop-muted tabular-nums">
            No hay movimientos {filter.toLowerCase()} en este momento
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {movements.map((wm) => (
            <WarehouseMovementCard
              key={wm.id}
              movement={wm}
              onAcceptMovement={onAcceptMovement}
              onConfigureSalida={onConfigureSalida}
            />
          ))}
        </div>
      )}
    </div>
  );
}

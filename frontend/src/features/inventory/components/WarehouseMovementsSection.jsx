import React, { useState } from "react";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { Pagination } from "@/components/shop/ShopUI";
import WarehouseMovementCard from "./WarehouseMovementCard";

const PAGE_SIZE = 10;
const FILTERS = ["Pendientes", "Todos", "Aceptados"];
const STATUS_COLORS = {
  Pendiente: "bg-amber-100 text-amber-900",
  Aceptado: "bg-emerald-100 text-emerald-800",
  Rechazado: "bg-rose-100 text-rose-800"
};

export default function WarehouseMovementsSection({
  movements = [],
  filter = "Pendientes",
  onFilterChange,
  onAcceptMovement
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const page = Math.min(currentPage, Math.max(1, Math.ceil(movements.length / PAGE_SIZE)));
  const pageMovements = movements.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const changeFilter = (nextFilter) => {
    if (nextFilter === filter) return;
    setCurrentPage(1);
    setExpandedId(null);
    onFilterChange(nextFilter);
  };

  return (
    <div className="overflow-hidden rounded-[2px] border border-shop-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-shop-line px-4 py-3 sm:px-6">
        <h2 className="text-base font-semibold text-shop-ink">Movimientos de Almacén</h2>
        <div role="group" aria-label="Filtrar movimientos" className="flex flex-wrap gap-1 rounded-[2px] bg-shop-light p-1">
          {FILTERS.map((tab) => (
            <button
              key={tab}
              type="button"
              aria-pressed={filter === tab}
              onClick={() => changeFilter(tab)}
              className={`min-h-8 rounded-[2px] px-3 py-1 text-[11px] font-semibold ${filter === tab
                ? "bg-white text-shop-ink"
                : "text-shop-muted hover:text-shop-ink"}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {pageMovements.length === 0 ? (
        <div className="flex items-center justify-center gap-2 px-4 py-6 text-xs font-medium text-shop-muted">
          <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-emerald-600" />
          {filter === "Todos" ? "No hay movimientos registrados." : `No hay movimientos ${filter.toLowerCase()}.`}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table aria-label="Movimientos de almacén" className="w-full min-w-[560px] text-left text-xs">
              <thead className="border-b border-shop-line bg-shop-light text-shop-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold sm:pl-6">Movimiento</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Referencia</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Fecha</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
                  <th scope="col" className="px-4 py-3 text-center font-semibold sm:px-6">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-shop-line">
                {pageMovements.map((movement) => {
                  const { id, type, originType, orderId, opId, guideNumber, date, status } = movement;
                  const expanded = expandedId === id;
                  const actionLabel = expanded ? "Ocultar" : status === "Pendiente" ? "Revisar" : "Ver detalle";
                  return (
                    <React.Fragment key={id}>
                      <tr className="hover:bg-shop-light/50">
                        <td className="px-4 py-2.5 sm:pl-6">
                          <span className="font-semibold text-shop-ink">{type}</span>
                          {originType && <span className="ml-2 text-[11px] text-shop-muted">{originType}</span>}
                        </td>
                        <td className="px-4 py-2.5 tabular-nums">
                          <span className="break-all text-shop-ink">{orderId || opId || id}</span>
                          {guideNumber && <span className="block text-[11px] font-medium text-shop-blue">{guideNumber}</span>}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-shop-muted">{date || "—"}</td>
                        <td className="px-4 py-2.5">
                          <span className={`whitespace-nowrap rounded-[2px] px-2 py-1 text-[11px] font-semibold ${STATUS_COLORS[status] || "bg-shop-light text-shop-muted"}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center sm:px-6">
                          <button
                            type="button"
                            aria-label={`${actionLabel} · ${id}`}
                            aria-expanded={expanded}
                            onClick={() => setExpandedId(expanded ? null : id)}
                            className="inline-flex min-h-9 items-center gap-1 whitespace-nowrap rounded-[2px] border border-shop-line bg-white px-2.5 font-semibold text-shop-blue hover:bg-shop-light"
                          >
                            {actionLabel}
                            <ChevronDown aria-hidden="true" className={`size-3.5 ${expanded ? "rotate-180" : ""}`} />
                          </button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr>
                          <td colSpan={5} className="bg-shop-light/40 px-4 py-3 sm:px-6">
                            <WarehouseMovementCard movement={movement} onAcceptMovement={onAcceptMovement} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {movements.length > PAGE_SIZE && (
            <Pagination
              currentPage={page}
              pageSize={PAGE_SIZE}
              totalItems={movements.length}
              itemLabel="movimientos"
              onPageChange={(nextPage) => {
                setCurrentPage(nextPage);
                setExpandedId(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

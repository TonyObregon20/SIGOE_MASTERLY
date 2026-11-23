import React from "react";
import { FileText, Globe } from "lucide-react";

/**
 * Expandable Kardex history table for an individual product
 */
export default function KardexHistoryTable({ product, kardex = [] }) {
  const productKardex = kardex
    .filter((k) => k.productId === product.id)
    .reverse();

  return (
    <div className="bg-shop-light/55 border-t border-shop-line p-3 sm:p-4 min-w-0 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <h5 className="font-semibold text-shop-ink text-[11px] flex items-center gap-2">
          <FileText size={14} strokeWidth={1.6} className="text-shop-blue" /> Movimientos Recientes de Kardex
        </h5>
        <button
          type="button"
          className="text-[11px] font-semibold text-shop-blue hover:bg-shop-light transition-colors px-3 py-2 bg-white border border-shop-line rounded-[2px] font-shop min-h-10 shrink-0"
        >
          Exportar Reporte
        </button>
      </div>

      <div className="bg-white rounded-[2px] border border-shop-line overflow-x-auto max-w-full">
        <table className="w-full text-left min-w-[680px] text-[13px]">
          <thead className="bg-shop-light text-shop-muted text-[11px] font-semibold border-b border-shop-line tabular-nums">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">Fecha</th>
              <th className="px-4 py-3 whitespace-nowrap">Operación</th>
              <th className="px-4 py-3 whitespace-nowrap">Referencia / Glosa</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">Cantidad</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">Saldo Final</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-shop-line text-sm font-shop">
            {productKardex.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-shop-muted text-xs">
                  No hay movimientos registrados para esta prenda.
                </td>
              </tr>
            ) : (
              productKardex.map((entry, idx) => (
                <tr
                  key={entry._id || entry.id || `k-${idx}`}
                  className="hover:bg-shop-light/80 transition-colors"
                >
                  <td className="px-4 py-3 tabular-nums text-[11px] text-shop-muted">
                    {entry.date}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${
                        entry.type === "Ingreso"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-rose-50 text-rose-600 border-rose-100"
                      }`}
                    >
                      {entry.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-shop-muted font-shop not-italic">
                    <div className="font-medium text-shop-ink text-xs">{entry.reason}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {entry.documentRef && (
                        <div className="text-[11px] font-semibold text-shop-blue flex items-center gap-1 bg-shop-light px-1.5 py-0.5 rounded-[2px] border border-shop-light">
                          <FileText className="w-3 h-3" /> {entry.documentRef}
                        </div>
                      )}
                      {entry.location && (
                        <div className="text-[11px] font-semibold text-amber-600 flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-[2px] border border-amber-100">
                          <Globe className="w-3 h-3" /> {entry.location}
                        </div>
                      )}
                    </div>
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-semibold text-sm tabular-nums ${
                      entry.type === "Ingreso" ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {entry.type === "Ingreso" ? "+" : "-"}
                    {entry.quantity}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-shop-ink text-base tabular-nums">
                    {entry.balance}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

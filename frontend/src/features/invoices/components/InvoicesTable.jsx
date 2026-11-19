import React from "react";
import { Eye, AlertCircle } from "lucide-react";

/**
 * Table displaying issued invoices with statuses, customer info, and quick actions
 */
export default function InvoicesTable({ invoices = [], onSelectInvoice, onCancelInvoice }) {
  return (
    <div className="bg-white border border-shop-line rounded-[2px] overflow-x-auto max-w-full">
      <table className="w-full text-left min-w-[680px] text-[13px]">
        <thead className="bg-shop-light border-b border-shop-line tabular-nums">
          <tr>
            <th className="px-6 py-4 text-xs font-medium text-shop-muted whitespace-nowrap">
              Comprobante
            </th>
            <th className="px-6 py-4 text-xs font-medium text-shop-muted whitespace-nowrap">
              Cliente / Documento
            </th>
            <th className="px-6 py-4 text-xs font-medium text-shop-muted whitespace-nowrap">
              Fecha / Estado
            </th>
            <th className="px-6 py-4 text-xs font-medium text-shop-muted whitespace-nowrap">
              Total (Inc. IGV)
            </th>
            <th className="px-6 py-4 text-xs font-medium text-shop-muted text-right whitespace-nowrap">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-shop-line">
          {invoices.map((inv, idx) => (
            <tr
              key={inv._id || inv.id || `inv-${idx}`}
              className="hover:bg-shop-light/5 transition-colors"
            >
              <td className="px-6 py-4">
                <div className="font-semibold text-shop-ink text-sm tracking-tight tabular-nums">
                  {inv.series}-{inv.number}
                </div>
                <div className="text-[11px] font-medium text-shop-blue tracking-[0.1em] tabular-nums">
                  {inv.type}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-shop-ink">{inv.customerName}</div>
                <div className="text-[11px] tabular-nums text-shop-muted">{inv.customerDocument}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-xs text-shop-muted font-medium mb-1 tabular-nums">{inv.date}</div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums ${
                    inv.status === "Emitido"
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : "bg-red-50 text-red-600 border border-red-100"
                  }`}
                >
                  {inv.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="tabular-nums font-semibold text-shop-ink">
                  S/ {Number(inv.total || 0).toFixed(2)}
                </div>
                <div className="text-[11px] text-shop-muted tabular-nums">
                  IGV: S/ {Number(inv.igv || 0).toFixed(2)}
                </div>
              </td>
              <td className="px-6 py-4 text-right tabular-nums">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectInvoice(inv)}
                    className="p-2 bg-shop-light text-shop-muted rounded-[2px] hover:text-shop-blue hover:bg-white transition-all cursor-pointer"
                    title="Ver Comprobante"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {inv.status === "Emitido" && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("¿Está seguro de anular este comprobante?")) {
                          onCancelInvoice?.(inv.id);
                        }
                      }}
                      className="p-2 bg-shop-light text-shop-muted rounded-[2px] hover:text-red-600 hover:bg-white transition-all cursor-pointer"
                      title="Anular Comprobante"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {invoices.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-6 py-20 text-center text-shop-muted font-shop"
              >
                No se encontraron comprobantes emitidos.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

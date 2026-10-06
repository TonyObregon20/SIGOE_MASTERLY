import React from "react";
import { Eye, AlertCircle } from "lucide-react";

/**
 * Table displaying issued invoices with statuses, customer info, and quick actions
 */
export default function InvoicesTable({ invoices = [], onSelectInvoice, onCancelInvoice }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200 font-mono">
          <tr>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Comprobante
            </th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Cliente / Documento
            </th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Fecha / Estado
            </th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Total (Inc. IGV)
            </th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoices.map((inv, idx) => (
            <tr
              key={inv._id || inv.id || `inv-${idx}`}
              className="hover:bg-slate-50/5 transition-colors"
            >
              <td className="px-6 py-4">
                <div className="font-black text-slate-900 text-sm tracking-tight font-mono">
                  {inv.series}-{inv.number}
                </div>
                <div className="text-[9px] font-bold text-indigo-500 uppercase tracking-[0.1em] font-mono">
                  {inv.type}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-slate-800">{inv.customerName}</div>
                <div className="text-[10px] font-mono text-slate-400">{inv.customerDocument}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-xs text-slate-500 font-medium mb-1 font-mono">{inv.date}</div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase font-mono ${
                    inv.status === "Emitido"
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : "bg-red-50 text-red-600 border border-red-100"
                  }`}
                >
                  {inv.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="font-mono font-black text-slate-950">
                  S/ {Number(inv.total || 0).toFixed(2)}
                </div>
                <div className="text-[9px] text-slate-400 font-mono">
                  IGV: S/ {Number(inv.igv || 0).toFixed(2)}
                </div>
              </td>
              <td className="px-6 py-4 text-right font-mono">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectInvoice(inv)}
                    className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-indigo-600 hover:bg-white hover:shadow-md transition-all cursor-pointer"
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
                      className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-red-600 hover:bg-white hover:shadow-md transition-all cursor-pointer"
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
                className="px-6 py-20 text-center text-slate-400 font-serif italic"
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

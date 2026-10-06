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
    <div className="bg-slate-50/55 border-t border-slate-100 p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h5 className="font-black text-slate-900 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
          🚀 Movimientos Recientes de Kardex
        </h5>
        <button
          type="button"
          className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-sm font-sans"
        >
          Exportar Reporte
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xl shadow-slate-950/5">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black tracking-widest border-b border-slate-200 font-mono">
            <tr>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Operación</th>
              <th className="px-6 py-4">Referencia / Glosa</th>
              <th className="px-6 py-4 text-right">Cantidad</th>
              <th className="px-6 py-4 text-right">Saldo Final</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 italic text-sm font-serif">
            {productKardex.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-xs">
                  No hay movimientos registrados para esta prenda.
                </td>
              </tr>
            ) : (
              productKardex.map((entry, idx) => (
                <tr
                  key={entry._id || entry.id || `k-${idx}`}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                    {entry.date}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        entry.type === "Ingreso"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-rose-50 text-rose-600 border-rose-100"
                      }`}
                    >
                      {entry.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-sans not-italic">
                    <div className="font-bold text-slate-800 text-xs">{entry.reason}</div>
                    <div className="flex items-center gap-3 mt-1.5">
                      {entry.documentRef && (
                        <div className="text-[9px] font-black text-indigo-600 flex items-center gap-1 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                          <FileText className="w-3 h-3" /> {entry.documentRef}
                        </div>
                      )}
                      {entry.location && (
                        <div className="text-[9px] font-black text-amber-600 flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                          <Globe className="w-3 h-3" /> {entry.location}
                        </div>
                      )}
                    </div>
                  </td>
                  <td
                    className={`px-6 py-4 text-right font-black text-sm font-mono ${
                      entry.type === "Ingreso" ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {entry.type === "Ingreso" ? "+" : "-"}
                    {entry.quantity}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-950 text-base font-mono">
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

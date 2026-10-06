import React from "react";
import { CheckCircle2 } from "lucide-react";

/**
 * Card representing an individual warehouse movement (Ingreso or Salida)
 */
export default function WarehouseMovementCard({ movement: wm, onAcceptMovement }) {
  const isIngreso = wm.type === "Ingreso";
  const isPending = wm.status === "Pendiente";

  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        isPending
          ? "bg-amber-50/50 border-amber-200 shadow-sm"
          : "bg-slate-50/60 border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border font-mono ${
              isIngreso
                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                : "bg-rose-100 text-rose-800 border-rose-200"
            }`}
          >
            {wm.id} • {wm.type}
          </span>
          <span className="text-[10px] font-black uppercase tracking-wider bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded font-mono">
            {wm.originType}
          </span>
        </div>

        <span
          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded font-mono ${
            isPending
              ? "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse"
              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
          }`}
        >
          {wm.status}
        </span>
      </div>

      <div className="space-y-1.5 mb-4 text-xs font-medium text-slate-700">
        {wm.opId && (
          <p className="font-mono text-[11px]">
            <strong className="text-slate-900">OP Origen:</strong> {wm.opId}
          </p>
        )}
        {wm.orderId && (
          <p className="font-mono text-[11px]">
            <strong className="text-slate-900">Orden Venta:</strong> {wm.orderId}
          </p>
        )}

        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1 mt-2">
          <p className="text-[10px] font-black uppercase text-slate-400 font-mono">
            Prendas Verificadas:
          </p>
          {wm.items?.map((it, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-800">
              <span className="truncate">{it.productName || it.productId}</span>
              <span className="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded ml-2">
                {it.quantity} Uds {it.selectedSize ? `(${it.selectedSize})` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>

      {isPending ? (
        <button
          type="button"
          onClick={() => onAcceptMovement(wm.id)}
          className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${
            isIngreso
              ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
              : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          {isIngreso
            ? "Verificar y Aceptar Ingreso (+Stock)"
            : "Aceptar y Despachar Salida (-Stock)"}
        </button>
      ) : (
        <div className="text-center py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-wider font-mono">
          ✓ Aceptado y registrado en Kardex ({wm.processedAt ? wm.processedAt.slice(0, 10) : wm.date})
        </div>
      )}
    </div>
  );
}

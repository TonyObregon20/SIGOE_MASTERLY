import React, { useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";

/**
 * Card representing an individual warehouse movement (Ingreso or Salida)
 */
export default function WarehouseMovementCard({ movement: wm, onAcceptMovement, onConfigureSalida }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const sending = useRef(false);
  const needsGuideMode = wm.type === "Salida" && wm.guideVersion != null && !wm.guideMode;
  const accept = async () => {
    if (sending.current) return;
    if (needsGuideMode) { onConfigureSalida?.(wm); return; }
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await onAcceptMovement(wm.id);
      if (!result?.success) setError(result?.message || "No se pudo aprobar el movimiento.");
    } catch (err) { setError(err.message); }
    finally { sending.current = false; setBusy(false); }
  };
  const isIngreso = wm.type === "Ingreso";
  const isPending = wm.status === "Pendiente";

  return (
    <div
      className={`p-4 min-w-0 flex flex-col rounded-[2px] border transition-colors ${
        isPending
          ? "bg-amber-50/50 border-amber-200"
          : "bg-shop-light/60 border-shop-line"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap min-w-0 items-center gap-2">
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-[2px] border tabular-nums break-all ${
              isIngreso
                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                : "bg-rose-100 text-rose-800 border-rose-200"
            }`}
          >
            {wm.id} • {wm.type}
          </span>
          <span className="text-[11px] font-semibold bg-slate-200/80 text-shop-muted px-2 py-0.5 rounded-[2px] tabular-nums">
            {wm.originType}
          </span>
        </div>

        <span
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-[2px] tabular-nums ${
            isPending
              ? "bg-amber-100 text-amber-800 border border-amber-200"
              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
          }`}
        >
          {wm.status}
        </span>
      </div>

      <div className="space-y-1.5 mb-3 break-words text-xs font-medium text-shop-muted">
        {wm.opId && (
          <p className="tabular-nums text-[11px]">
            <strong className="text-shop-ink">OP Origen:</strong> {wm.opId}
          </p>
        )}
        {wm.orderId && (
          <p className="tabular-nums text-[11px]">
            <strong className="text-shop-ink">Orden Venta:</strong> {wm.orderId}
          </p>
        )}

        <div className="bg-white p-3 rounded-[2px] border border-shop-line space-y-1 mt-2">
          <p className="text-[11px] font-semibold text-shop-muted tabular-nums">
            Prendas Verificadas:
          </p>
          {wm.items?.map((it, idx) => (
            <div key={idx} className="flex justify-between items-start gap-2 text-xs font-medium text-shop-ink">
              <span className="min-w-0 break-words">{it.productName || it.productId}</span>
              <span className="tabular-nums text-shop-blue bg-shop-light px-2 py-0.5 rounded-[2px] shrink-0">
                {it.quantity} Uds {it.selectedSize ? `(${it.selectedSize})` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>

      {!isIngreso && <p className="text-xs text-shop-muted break-words mb-3">{wm.guideMode === "CON_GUIA" ? `CON GUÍA · ${wm.guideNumber}` : wm.guideMode === "SIN_GUIA" ? "SIN GUÍA" : needsGuideMode ? "Modalidad pendiente" : "Registro histórico"}</p>}
      {error && <p role="alert" className="text-sm text-red-800 bg-red-50 p-3 rounded-[2px] mb-3">{error}</p>}
      <div className="mt-auto border-t border-shop-line pt-3">
        {isPending ? (
          <button
            type="button"
            onClick={accept}
            disabled={busy}
            className={`w-full min-h-10 py-2 px-3 rounded-[2px] text-xs font-semibold text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2 ${
              isIngreso
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-shop-ink hover:bg-shop-blue"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isIngreso
              ? "Verificar y Aceptar Ingreso (+Stock)"
              : needsGuideMode ? "Generar salida: elegir CON GUÍA / SIN GUÍA" : busy ? "Aprobando…" : "Aprobar Salida (-Stock)"}
          </button>
        ) : (
          <div className="text-center py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-[2px] text-[11px] font-semibold tabular-nums">
            Aceptado y registrado en Kardex ({wm.processedAt ? wm.processedAt.slice(0, 10) : wm.date})
          </div>
        )}
      </div>
    </div>
  );
}

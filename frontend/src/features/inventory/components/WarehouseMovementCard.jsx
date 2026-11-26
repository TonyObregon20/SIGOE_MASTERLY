import React from "react";
import { CheckCircle2, Download } from "lucide-react";
import { generateSalidaGuidePDF } from "@/utils/pdfGenerator";

/**
 * Card representing an individual warehouse movement (Ingreso or Salida)
 */
export default function WarehouseMovementCard({ movement: wm, onAcceptMovement }) {
  const isIngreso = wm.type === "Ingreso";
  const isPending = wm.status === "Pendiente";
  const isAccepted = wm.status === "Aceptado";
  const requiresGuide = !isIngreso && wm.requiresGuide !== false && wm.channel !== "presencial" && Boolean(wm.orderId || wm.opId);
  const hasGuide = requiresGuide && wm.guideNumber && wm.carrier?.trim();
  const needsGuide = requiresGuide && !hasGuide;

  return (
    <div
      className={`p-5 rounded-[2px] border transition-all ${
        isPending
          ? "bg-amber-50/50 border-amber-200"
          : "bg-shop-light/60 border-shop-line"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-[2px] border tabular-nums ${
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
              : isAccepted ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
              : "bg-shop-light text-shop-muted border border-shop-line"
          }`}
        >
          {wm.status}
        </span>
      </div>

      <div className="space-y-1.5 mb-4 text-xs font-medium text-shop-muted">
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
        {hasGuide && (
          <>
            <button
              type="button"
              onClick={() => generateSalidaGuidePDF(wm)}
              className="flex items-center gap-1.5 text-xs font-semibold text-shop-blue hover:underline"
              aria-label={`Descargar guía ${wm.guideNumber} en PDF`}
            >
              <Download className="size-3.5" aria-hidden="true" /> {wm.guideNumber}
            </button>
            <p><strong className="text-shop-ink">Transportista:</strong> {wm.carrier}</p>
          </>
        )}
        {wm.channel === "presencial" && <p className="text-xs text-shop-blue">Venta presencial · Entregado en tienda · No requiere guía</p>}

        <div className="bg-white p-3 rounded-[2px] border border-shop-line space-y-1 mt-2">
          <p className="text-[11px] font-semibold text-shop-muted tabular-nums">
            Prendas Verificadas:
          </p>
          {wm.items?.map((it, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs font-medium text-shop-ink">
              <span className="truncate">{it.productName || it.productId}</span>
              <span className="tabular-nums text-shop-blue bg-shop-light px-2 py-0.5 rounded-[2px] ml-2">
                {it.quantity} Uds {it.selectedSize ? `(${it.selectedSize})` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>

      {isPending && needsGuide ? (
        <p className="text-xs text-amber-800">Registra la guía y el transportista desde Generar Salida.</p>
      ) : isPending ? (
        <button
          type="button"
          onClick={() => onAcceptMovement(wm.id)}
          className={`w-full py-3 px-4 rounded-[2px] text-xs font-semibold text-white transition-all flex items-center justify-center gap-2 ${
            isIngreso
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-shop-ink hover:bg-shop-ink"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          {isIngreso
            ? "Verificar y Aceptar Ingreso (+Stock)"
            : "Aprobar salida (-Stock)"}
        </button>
      ) : isAccepted && (
        <div className="text-center py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-[2px] text-[11px] font-semibold tabular-nums">
          Aceptado y registrado en Kardex ({wm.processedAt ? wm.processedAt.slice(0, 10) : wm.date})
        </div>
      )}
    </div>
  );
}

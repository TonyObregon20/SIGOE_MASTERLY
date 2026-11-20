import React from "react";
import { Eye, EyeOff, Layers } from "lucide-react";
import { getSizeStockBreakdown, getAvailableStock } from "../productsUtils";

/**
 * Product item row/card displayed in the Ecommerce catalog table/list
 * Shows pricing, web visibility, and stock breakdown per size (S, M, L, XL)
 */
export default function EcommerceProductRow({ product: p, onUpdateProduct, onOpenEditModal }) {
  const formattedRef = String(p.id).padStart(4, "0");
  const sizeBreakdown = getSizeStockBreakdown(p);
  const totalAvailable = getAvailableStock(p);
  const totalPhysical = Number(p.stockPhysical) || 0;

  return (
    <div className="bg-white border border-shop-line rounded-[2px] overflow-hidden transition-shadow">
      <div className="grid grid-cols-1 items-center gap-5 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_210px] xl:grid-cols-[minmax(0,1fr)_210px_minmax(0,1fr)] xl:gap-6">
        {/* Thumbnail & Basic Info */}
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative w-16 h-20 bg-shop-light rounded-[2px] overflow-hidden border border-shop-line flex-shrink-0">
            <img
              src={p.image}
              alt={p.name}
              className="w-full h-full object-cover transition-all"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <h4 className="line-clamp-2 font-semibold text-shop-ink text-sm leading-5 tracking-tight">
              {p.name}
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              <span className="shrink-0 text-[11px] font-semibold text-shop-blue bg-shop-light px-2 py-0.5 rounded-[2px] border border-shop-light">
                {p.category}
              </span>
              <span className="min-w-0 break-all text-[11px] font-medium text-shop-muted tabular-nums">
                REF: {formattedRef}
              </span>
            </div>
          </div>
        </div>

        {/* Stock by sizes display badge row */}
        <div className="w-full min-w-0 bg-shop-light p-2 rounded-[2px] border border-shop-line/80 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-shop-muted tabular-nums">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-shop-blue" /> Stock por Tallas
            </span>
            <span className="text-shop-muted font-medium">{totalAvailable} disp.</span>
          </div>

          <div className="grid grid-cols-4 gap-1 text-center tabular-nums">
            {["S", "M", "L", "XL"].map((sz) => {
              const avail = sizeBreakdown[sz] ?? 0;
              return (
                <div key={sz} className="bg-white px-1.5 py-0.5 rounded-[2px] border border-shop-line">
                  <span className="text-[11px] font-medium text-shop-muted block leading-tight">{sz}</span>
                  <span className={`text-[11px] font-semibold leading-tight ${avail > 0 ? "text-shop-blue" : "text-rose-600"}`}>
                    {avail}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pricing, Visibility, and Description Column */}
        <div className="grid min-w-0 grid-cols-2 items-start gap-4 border-t border-shop-line pt-4 sm:grid-cols-[minmax(0,1fr)_110px_100px] md:col-span-2 xl:col-span-1 xl:grid-cols-[minmax(0,1fr)_94px_88px] xl:gap-3 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-5">
          {/* Price field */}
          <div className="min-w-0 space-y-1">
            <label className="text-[11px] font-semibold text-shop-muted block tabular-nums">
              Precio Web
            </label>
            <div className="flex min-h-9 items-center">
              <span className="break-words text-sm font-semibold text-shop-ink tabular-nums tracking-tighter">
                S/ {Number(p.price || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Visibility Live Toggle */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-shop-muted block tabular-nums">
              Visibilidad
            </label>
            <button
              type="button"
              onClick={() => onUpdateProduct(p.id, { isPublic: p.isPublic === false ? true : false })}
              className={`flex min-h-9 w-full items-center justify-center gap-2 px-2 py-1.5 rounded-[2px] border text-[11px] font-semibold transition-all ${
                p.isPublic !== false
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : "bg-shop-light text-shop-muted border-shop-line hover:bg-slate-200"
              }`}
            >
              {p.isPublic !== false ? (
                <>
                  <Eye className="w-3 h-3" /> Público
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3" /> Oculto
                </>
              )}
            </button>
          </div>

          {/* Action buttons */}
          <div className="col-span-2 self-end sm:col-span-1">
            <button
              type="button"
              onClick={() => onOpenEditModal(p)}
              className="w-full px-3 py-2 bg-shop-ink text-white rounded-[2px] text-[11px] font-semibold hover:bg-shop-ink transition-all tabular-nums min-h-9"
            >
              Modificar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

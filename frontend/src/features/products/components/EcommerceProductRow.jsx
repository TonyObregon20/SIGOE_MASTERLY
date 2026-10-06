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
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5 flex items-center gap-6 flex-wrap lg:flex-nowrap">
        {/* Thumbnail & Basic Info */}
        <div className="flex items-center gap-4 min-w-[240px] w-full lg:w-auto">
          <div className="relative w-16 h-20 bg-slate-50 rounded-lg overflow-hidden border border-slate-200 shadow-inner flex-shrink-0">
            <img
              src={p.image}
              alt={p.name}
              className="w-full h-full object-cover grayscale-[15%] hover:grayscale-0 transition-all"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="space-y-1 flex-1">
            <h4 className="font-black text-slate-900 text-sm leading-tight uppercase tracking-tight">
              {p.name}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {p.category}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                REF: {formattedRef}
              </span>
            </div>
          </div>
        </div>

        {/* Stock by sizes display badge row */}
        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80 min-w-[210px] space-y-1">
          <div className="flex items-center justify-between text-[9px] font-black uppercase text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-blue-600" /> Stock por Tallas
            </span>
            <span className="text-slate-700 font-bold">{totalAvailable} disp.</span>
          </div>

          <div className="grid grid-cols-4 gap-1 text-center font-mono">
            {["S", "M", "L", "XL"].map((sz) => {
              const avail = sizeBreakdown[sz] ?? 0;
              return (
                <div key={sz} className="bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                  <span className="text-[9px] font-bold text-slate-500 block leading-tight">{sz}</span>
                  <span className={`text-[10px] font-black leading-tight ${avail > 0 ? "text-blue-700" : "text-rose-600"}`}>
                    {avail}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pricing, Visibility, and Description Column */}
        <div className="flex flex-1 items-center justify-between gap-6 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 w-full lg:w-auto">
          {/* Price field */}
          <div className="space-y-1 min-w-[90px]">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block font-mono">
              Precio Web
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-950 font-mono tracking-tighter">
                S/ {Number(p.price || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Visibility Live Toggle */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block font-mono">
              Visibilidad
            </label>
            <button
              type="button"
              onClick={() => onUpdateProduct(p.id, { isPublic: p.isPublic === false ? true : false })}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${
                p.isPublic !== false
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
              }`}
            >
              {p.isPublic !== false ? (
                <>
                  <Eye className="w-3 h-3 animate-pulse" /> Público
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3" /> Oculto
                </>
              )}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => onOpenEditModal(p)}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-blue-600 transition-all active:scale-95 font-mono"
            >
              Modificar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

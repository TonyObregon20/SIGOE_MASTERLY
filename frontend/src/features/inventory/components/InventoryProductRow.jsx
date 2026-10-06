import React from "react";
import { Plus, ClipboardList, History, Layers } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import KardexHistoryTable from "./KardexHistoryTable";
import { getSizeStockBreakdown } from "@/features/products/productsUtils";

/**
 * Product inventory item card with stock metrics and actions (+Stock, Produce, Kardex)
 * Displays breakdown of physical and committed stock per size
 */
export default function InventoryProductRow({
  product: p,
  isSelected,
  onToggleSelect,
  onOpenAddStock,
  onNewProduction,
  kardex = []
}) {
  const availableStock = (Number(p.stockPhysical) || 0) - (Number(p.stockCommitted) || 0);
  const isLowStock = availableStock <= (Number(p.minStock) || 10);
  const formattedId = String(p.id || "").padStart(3, "0");
  const sizeBreakdown = getSizeStockBreakdown(p);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5 flex items-center justify-between flex-wrap gap-4">
        {/* Product image & ID/Category info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden border border-slate-200 p-1 flex-shrink-0">
            <img
              src={p.image}
              alt={p.name}
              className="w-full h-full object-cover rounded-lg"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h4 className="font-black text-slate-900 text-base uppercase tracking-tight leading-tight">
              {p.name}
            </h4>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                ID: {formattedId}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {p.category}
              </span>
            </div>
          </div>
        </div>

        {/* Stock Breakdown by Sizes */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 min-w-[220px]">
          <div className="flex items-center justify-between text-[9px] font-black uppercase text-slate-500 font-mono mb-1">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-blue-600" /> Tallas Disponibles
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
            {["S", "M", "L", "XL"].map((sz) => {
              const avail = sizeBreakdown[sz] ?? 0;
              return (
                <div key={sz} className="bg-white px-1.5 py-1 rounded border border-slate-200 shadow-2xs">
                  <span className="text-[9px] font-bold text-slate-500 block leading-tight">{sz}</span>
                  <span className={`text-[10px] font-black leading-tight ${avail > 0 ? "text-blue-700" : "text-rose-600"}`}>
                    {avail}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stock Metrics and Action Buttons */}
        <div className="flex items-center gap-8 flex-wrap sm:flex-nowrap">
          {/* Physical stock */}
          <div className="text-center">
            <div className="text-[9px] text-slate-400 uppercase font-black tracking-[0.2em] mb-0.5 font-mono">
              Físico
            </div>
            <div className="text-xl font-black text-slate-950 font-mono">
              {p.stockPhysical}{" "}
              <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest ml-0.5">
                uds
              </span>
            </div>
          </div>

          {/* Committed stock */}
          <div className="text-center">
            <div className="text-[9px] text-slate-400 uppercase font-black tracking-[0.2em] mb-0.5 font-mono">
              Comprometido
            </div>
            <div className="text-xl font-black text-blue-600 font-mono">
              {p.stockCommitted}{" "}
              <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest ml-0.5">
                uds
              </span>
            </div>
          </div>

          {/* Web / Available stock */}
          <div className="text-center bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 min-w-[110px]">
            <div className="text-[9px] text-blue-500 uppercase font-black tracking-[0.2em] mb-0.5 font-mono">
              Web (Disponible)
            </div>
            <div
              className={`text-2xl font-black font-mono ${
                isLowStock ? "text-rose-600" : "text-blue-700"
              }`}
            >
              {availableStock}{" "}
              <span className="text-xs font-normal text-blue-400 uppercase tracking-widest ml-1">
                uds
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOpenAddStock(p.id)}
              className="p-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all border border-slate-200 shadow-sm shadow-blue-900/5 active:scale-95 group"
              title="Añadir Stock"
            >
              <Plus className="w-5 h-5 group-hover:scale-125 transition-transform" />
            </button>
            <button
              type="button"
              onClick={() => onNewProduction([{ product: p, quantity: 10 }])}
              className="p-3 bg-white text-slate-600 rounded-xl hover:bg-slate-50 transition-all border border-slate-200 shadow-sm active:scale-95"
              title="Producir más"
            >
              <ClipboardList className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onToggleSelect}
              className={`p-3 rounded-xl transition-all border shadow-sm active:scale-95 ${
                isSelected
                  ? "bg-slate-950 text-white border-slate-950 shadow-slate-900/20"
                  : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
              }`}
              title="Ver Historial (Kardex)"
            >
              <History className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Kardex Table */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <KardexHistoryTable product={p} kardex={kardex} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

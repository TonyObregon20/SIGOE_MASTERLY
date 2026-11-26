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
    <div className="@container bg-white border border-shop-line rounded-[2px] overflow-hidden transition-shadow">
      <div className="grid grid-cols-1 items-center gap-4 p-5 @min-[36rem]:grid-cols-[minmax(0,1fr)_220px] @min-[70rem]:grid-cols-[minmax(0,1fr)_220px_minmax(0,1.54fr)]">
        {/* Product image & ID/Category info */}
        <div className="flex min-w-0 items-center gap-4">
          <div className="w-16 h-16 bg-shop-light rounded-[2px] overflow-hidden border border-shop-line p-1 flex-shrink-0">
            <img
              src={p.image}
              alt={p.name}
              className="w-full h-full object-cover rounded-[2px]"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-shop-ink text-base tracking-tight leading-tight [overflow-wrap:anywhere]">
              {p.name}
            </h4>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[11px] font-semibold text-shop-blue bg-shop-light px-2 py-0.5 rounded-[2px] border border-shop-light">
                ID: {formattedId}
              </span>
              <span className="text-[11px] font-medium text-shop-muted">
                {p.category}
              </span>
            </div>
          </div>
        </div>

        {/* Stock Breakdown by Sizes */}
        <div className="w-full bg-shop-light p-2.5 rounded-[2px] border border-shop-line/80 @min-[36rem]:self-start">
          <div className="flex items-center justify-between text-[11px] font-semibold text-shop-muted tabular-nums mb-1">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-shop-blue" /> Tallas Disponibles
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center tabular-nums">
            {["S", "M", "L", "XL"].map((sz) => {
              const avail = sizeBreakdown[sz] ?? 0;
              return (
                <div key={sz} className="bg-white px-1.5 py-1 rounded-[2px] border border-shop-line">
                  <span className="text-[11px] font-medium text-shop-muted block leading-tight">{sz}</span>
                  <span className={`text-[11px] font-semibold leading-tight ${avail > 0 ? "text-shop-blue" : "text-rose-600"}`}>
                    {avail}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stock Metrics and Action Buttons */}
        <div className="flex max-w-full flex-wrap items-center gap-x-8 gap-y-4 @min-[36rem]:col-span-full @min-[36rem]:justify-self-end @min-[70rem]:col-span-1">
          {/* Physical stock */}
          <div className="text-center">
            <div className="text-[11px] text-shop-muted font-semibold mb-0.5 tabular-nums">
              Físico
            </div>
            <div className="text-xl font-semibold text-shop-ink tabular-nums">
              {p.stockPhysical}{" "}
              <span className="text-[11px] font-normal text-shop-muted ml-0.5">
                uds
              </span>
            </div>
          </div>

          {/* Committed stock */}
          <div className="text-center">
            <div className="text-[11px] text-shop-muted font-semibold mb-0.5 tabular-nums">
              Comprometido
            </div>
            <div className="text-xl font-semibold text-shop-blue tabular-nums">
              {p.stockCommitted}{" "}
              <span className="text-[11px] font-normal text-shop-muted ml-0.5">
                uds
              </span>
            </div>
          </div>

          {/* Web / Available stock */}
          <div className="text-center bg-shop-light px-4 py-2 rounded-[2px] border border-shop-light min-w-[110px]">
            <div className="text-[11px] text-shop-blue font-semibold mb-0.5 tabular-nums">
              Web (Disponible)
            </div>
            <div
              className={`text-2xl font-semibold tabular-nums ${
                isLowStock ? "text-rose-600" : "text-shop-blue"
              }`}
            >
              {availableStock}{" "}
              <span className="text-xs font-normal text-blue-400 ml-1">
                uds
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOpenAddStock(p.id)}
              className="p-3 bg-white text-shop-blue rounded-[2px] hover:bg-shop-light transition-all border border-shop-line group"
              title="Añadir Stock"
            >
              <Plus className="w-5 h-5 transition-transform" />
            </button>
            <button
              type="button"
              onClick={() => onNewProduction([{ product: p, quantity: 10 }])}
              className="p-3 bg-white text-shop-muted rounded-[2px] hover:bg-shop-light transition-all border border-shop-line"
              title="Producir más"
            >
              <ClipboardList className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onToggleSelect}
              className={`p-3 rounded-[2px] transition-all border ${
                isSelected
                  ? "bg-shop-ink text-white border-slate-950"
                  : "bg-white text-shop-muted hover:bg-shop-light border-shop-line"
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

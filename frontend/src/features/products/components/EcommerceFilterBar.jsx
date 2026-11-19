import React from "react";
import { Search } from "lucide-react";

/**
 * Filter toolbar for Ecommerce management (Search query, category filter, visibility filter)
 */
export default function EcommerceFilterBar({
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
  filterVisibility,
  setFilterVisibility
}) {
  return (
    <div className="bg-shop-light p-4 rounded-[2px] border border-shop-line/60 flex flex-col md:flex-row items-center gap-4 justify-between">
      <div className="relative w-full md:max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-shop-muted">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Buscar por nombre o referencia..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-shop-line rounded-[2px] font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-shop-blue/20 focus:border-shop-line transition-all min-h-10 min-w-0 text-base sm:text-[13px]"
        />
      </div>

      <div className="flex items-center gap-4 flex-wrap w-full md:w-auto">
        {/* Category Filter */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-[2px] border border-shop-line text-[11px] font-medium">
          <span className="text-shop-muted px-2 tabular-nums text-[11px]">
            Categoría:
          </span>
          {["all", "Formal", "Casual", "Exterior"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-[2px] transition-all ${
                filterCategory === cat
                  ? "bg-shop-ink text-white"
                  : "text-shop-muted hover:text-shop-ink"
              }`}
            >
              {cat === "all" ? "Todos" : cat}
            </button>
          ))}
        </div>

        {/* Visibility Filter */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-[2px] border border-shop-line text-[11px] font-medium">
          <span className="text-shop-muted px-2 tabular-nums text-[11px]">
            Visibilidad:
          </span>
          <button
            type="button"
            onClick={() => setFilterVisibility("all")}
            className={`px-2.5 py-1 rounded-[2px] transition-all ${
              filterVisibility === "all"
                ? "bg-shop-ink text-white"
                : "text-shop-muted hover:text-shop-ink"
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setFilterVisibility("public")}
            className={`px-2.5 py-1 rounded-[2px] transition-all ${
              filterVisibility === "public"
                ? "bg-shop-ink text-white"
                : "text-shop-muted hover:text-shop-ink"
            }`}
          >
            Públicos
          </button>
          <button
            type="button"
            onClick={() => setFilterVisibility("hidden")}
            className={`px-2.5 py-1 rounded-[2px] transition-all ${
              filterVisibility === "hidden"
                ? "bg-shop-ink text-white"
                : "text-shop-muted hover:text-shop-ink"
            }`}
          >
            Ocultos
          </button>
        </div>
      </div>
    </div>
  );
}

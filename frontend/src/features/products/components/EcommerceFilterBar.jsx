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
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col md:flex-row items-center gap-4 justify-between">
      <div className="relative w-full md:max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Buscar por nombre o referencia..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      </div>

      <div className="flex items-center gap-4 flex-wrap w-full md:w-auto">
        {/* Category Filter */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 text-[11px] font-bold">
          <span className="text-slate-400 px-2 font-mono uppercase text-[9px] tracking-wider">
            Categoría:
          </span>
          {["all", "Formal", "Casual", "Exterior"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filterCategory === cat
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {cat === "all" ? "Todos" : cat}
            </button>
          ))}
        </div>

        {/* Visibility Filter */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 text-[11px] font-bold">
          <span className="text-slate-400 px-2 font-mono uppercase text-[9px] tracking-wider">
            Visibilidad:
          </span>
          <button
            type="button"
            onClick={() => setFilterVisibility("all")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              filterVisibility === "all"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setFilterVisibility("public")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              filterVisibility === "public"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Públicos
          </button>
          <button
            type="button"
            onClick={() => setFilterVisibility("hidden")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              filterVisibility === "hidden"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Ocultos
          </button>
        </div>
      </div>
    </div>
  );
}

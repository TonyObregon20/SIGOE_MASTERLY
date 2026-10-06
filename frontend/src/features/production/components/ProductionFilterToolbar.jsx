import React from "react";
import { Search, X, CalendarClock } from "lucide-react";

/**
 * Filter and search toolbar for Production Orders
 */
export default function ProductionFilterToolbar({
  searchQuery,
  setSearchQuery,
  selectedStage,
  setSelectedStage,
  selectedType,
  setSelectedType,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  sortBy,
  setSortBy,
  showAdvancedFilters,
  stagesList = [],
  stageCounts = {},
  filteredCount = 0,
  totalCount = 0,
  hasActiveFilters = false,
  onResetFilters
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
      {/* Search Bar & Sort Selector */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por OP (ej: OP-851), Pedido (ej: ORD-2194), Cliente o Modelo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider whitespace-nowrap">
            Ordenar:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white"
          >
            <option value="newest">Más recientes</option>
            <option value="oldest">Más antiguas</option>
            <option value="progress_desc">Mayor % avance</option>
            <option value="progress_asc">Menor % avance</option>
          </select>
        </div>
      </div>

      {/* Quick Stage Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200 pt-1 border-t border-slate-100">
        {stagesList.map((stg) => {
          const isSelected = selectedStage === stg;
          const count = stageCounts[stg] || 0;
          return (
            <button
              key={stg}
              onClick={() => setSelectedStage(stg)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
              }`}
            >
              <span>{stg === "TODAS" ? "Todas las Etapas" : stg}</span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Advanced Filters Drawer */}
      {showAdvancedFilters && (
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
          {/* Filter by Type */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 font-mono tracking-wider">
              Tipo de Origen
            </label>
            <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-200">
              {["TODOS", "PEDIDOS", "AUTOSTOCK"].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                    selectedType === type
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {type === "TODOS" ? "Todos" : type === "PEDIDOS" ? "Clientes" : "Stock"}
                </button>
              ))}
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 font-mono tracking-wider flex items-center gap-1">
              <CalendarClock className="w-3 h-3 text-slate-400" /> Fecha Desde
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 font-mono tracking-wider flex items-center gap-1">
              <CalendarClock className="w-3 h-3 text-slate-400" /> Fecha Hasta
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Results status summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-1">
        <span>
          Mostrando <strong className="text-slate-900 font-bold">{filteredCount}</strong> de{" "}
          <strong className="text-slate-900 font-bold">{totalCount}</strong> órdenes de producción
        </span>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 font-mono uppercase tracking-wider"
          >
            <X className="w-3.5 h-3.5" /> Limpiar Filtros
          </button>
        )}
      </div>
    </div>
  );
}

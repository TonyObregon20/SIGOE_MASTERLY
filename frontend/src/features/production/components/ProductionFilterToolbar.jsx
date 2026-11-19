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
    <div className="bg-white border border-shop-line rounded-[2px] p-4 space-y-4">
      {/* Search Bar & Sort Selector */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-shop-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por OP (ej: OP-851), Pedido (ej: ORD-2194), Cliente o Modelo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-shop-light border border-shop-line rounded-[2px] font-semibold text-shop-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-shop-blue/20 focus:bg-white transition-all font-shop min-h-10 min-w-0 text-base sm:text-[13px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-shop-muted hover:text-shop-muted p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-shop-muted tabular-nums whitespace-nowrap">
            Ordenar:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-shop-light border border-shop-line rounded-[2px] font-medium text-shop-muted focus:outline-none focus:bg-white min-h-10 min-w-0 text-base sm:text-[13px]"
          >
            <option value="newest">Más recientes</option>
            <option value="oldest">Más antiguas</option>
            <option value="progress_desc">Mayor % avance</option>
            <option value="progress_asc">Menor % avance</option>
          </select>
        </div>
      </div>

      {/* Quick Stage Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200 pt-1 border-t border-shop-line">
        {stagesList.map((stg) => {
          const isSelected = selectedStage === stg;
          const count = stageCounts[stg] || 0;
          return (
            <button
              key={stg}
              onClick={() => setSelectedStage(stg)}
              className={`px-3 py-1.5 rounded-[2px] text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? "bg-shop-ink text-white"
                  : "bg-shop-light text-shop-muted hover:bg-shop-light border border-shop-line/60"
              }`}
            >
              <span>{stg === "TODAS" ? "Todas las Etapas" : stg}</span>
              <span
                className={`text-[11px] tabular-nums px-1.5 py-0.2 rounded-full ${
                  isSelected ? "bg-slate-700 text-white" : "bg-slate-200 text-shop-muted"
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
        <div className="pt-3 border-t border-shop-line grid grid-cols-1 md:grid-cols-3 gap-4 fade-in duration-200 bg-shop-light/70 p-3.5 rounded-[2px] border">
          {/* Filter by Type */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-shop-muted tabular-nums">
              Tipo de Origen
            </label>
            <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-[2px] border border-shop-line">
              {["TODOS", "PEDIDOS", "AUTOSTOCK"].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`py-1.5 text-[11px] font-medium rounded-[2px] transition-all ${
                    selectedType === type
                      ? "bg-shop-ink text-white"
                      : "text-shop-muted hover:bg-shop-light"
                  }`}
                >
                  {type === "TODOS" ? "Todos" : type === "PEDIDOS" ? "Clientes" : "Stock"}
                </button>
              ))}
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-shop-muted tabular-nums flex items-center gap-1">
              <CalendarClock className="w-3 h-3 text-shop-muted" /> Fecha Desde
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-shop-line rounded-[2px] font-semibold text-shop-muted focus:outline-none min-h-10 min-w-0 text-base sm:text-[13px]"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-shop-muted tabular-nums flex items-center gap-1">
              <CalendarClock className="w-3 h-3 text-shop-muted" /> Fecha Hasta
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-shop-line rounded-[2px] font-semibold text-shop-muted focus:outline-none min-h-10 min-w-0 text-base sm:text-[13px]"
            />
          </div>
        </div>
      )}

      {/* Results status summary */}
      <div className="flex items-center justify-between text-xs text-shop-muted font-medium pt-1">
        <span>
          Mostrando <strong className="text-shop-ink font-medium">{filteredCount}</strong> de{" "}
          <strong className="text-shop-ink font-medium">{totalCount}</strong> órdenes de producción
        </span>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="text-xs font-medium text-shop-blue hover:text-shop-blue flex items-center gap-1 tabular-nums"
          >
            <X className="w-3.5 h-3.5" /> Limpiar Filtros
          </button>
        )}
      </div>
    </div>
  );
}

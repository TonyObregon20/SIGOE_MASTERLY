import React from "react";
import { Search } from "lucide-react";

/**
 * Filter and search bar for Invoices
 */
export default function InvoicesFilterBar({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType
}) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-shop-muted" />
        <input
          type="text"
          placeholder="Buscar por cliente, DNI/RUC o número..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-shop-line rounded-[2px] focus:ring-2 focus:ring-shop-blue/20 outline-none transition-all min-h-10 min-w-0 text-base sm:text-[13px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="grid w-full grid-cols-3 gap-1 rounded-[2px] border border-shop-line bg-white p-1 tabular-nums md:w-auto">
        <button
          type="button"
          onClick={() => setFilterType("all")}
          className={`px-4 py-1.5 rounded-[2px] text-[11px] font-semibold transition-all cursor-pointer ${
            filterType === "all" ? "bg-shop-ink text-white" : "text-shop-muted"
          }`}
        >
          Todos
        </button>
        <button
          type="button"
          onClick={() => setFilterType("Boleta")}
          className={`px-4 py-1.5 rounded-[2px] text-[11px] font-semibold transition-all cursor-pointer ${
            filterType === "Boleta" ? "bg-shop-ink text-white" : "text-shop-muted"
          }`}
        >
          Boletas
        </button>
        <button
          type="button"
          onClick={() => setFilterType("Factura")}
          className={`px-4 py-1.5 rounded-[2px] text-[11px] font-semibold transition-all cursor-pointer ${
            filterType === "Factura" ? "bg-shop-ink text-white" : "text-shop-muted"
          }`}
        >
          Facturas
        </button>
      </div>
    </div>
  );
}

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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por cliente, DNI/RUC o número..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm font-mono">
        <button
          type="button"
          onClick={() => setFilterType("all")}
          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
            filterType === "all" ? "bg-indigo-600 text-white" : "text-slate-500"
          }`}
        >
          Todos
        </button>
        <button
          type="button"
          onClick={() => setFilterType("Boleta")}
          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
            filterType === "Boleta" ? "bg-indigo-600 text-white" : "text-slate-500"
          }`}
        >
          Boletas
        </button>
        <button
          type="button"
          onClick={() => setFilterType("Factura")}
          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
            filterType === "Factura" ? "bg-indigo-600 text-white" : "text-slate-500"
          }`}
        >
          Facturas
        </button>
      </div>
    </div>
  );
}

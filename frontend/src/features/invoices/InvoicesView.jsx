import React, { useState } from "react";
import { ClipboardList } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useInvoiceFilters } from "./hooks/useInvoiceFilters";
import InvoicesFilterBar from "./components/InvoicesFilterBar";
import InvoicesTable from "./components/InvoicesTable";
import InvoiceDetailModal from "./components/InvoiceDetailModal";

/**
 * Invoices View / SUNAT Electronic Receipts Register
 * Lists, filters, prints, and manages Boletas and Facturas
 */
function InvoicesView({ invoices = [], products, onCancelInvoice }) {
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filteredInvoices
  } = useInvoiceFilters(invoices);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex items-start justify-between flex-col gap-4 xl:flex-row xl:items-center">
        <div className="space-y-1">
          <h1 className="text-shop-ink tracking-tight flex items-center gap-2 font-medium text-[28px]">
            <ClipboardList className="w-6 h-6 text-shop-blue" /> Registro de Comprobantes
          </h1>
          <p className="text-xs font-medium text-shop-muted font-shop">
            Historial legal de Boletas y Facturas emitidas por Masterly
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <InvoicesFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
      />

      {/* Invoices List Table */}
      <InvoicesTable
        invoices={filteredInvoices}
        onSelectInvoice={setSelectedInvoice}
        onCancelInvoice={onCancelInvoice}
      />

      {/* Receipt Preview & Printing Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <InvoiceDetailModal
            invoice={selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default InvoicesView;

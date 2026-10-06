import { useState, useMemo } from "react";
import { filterInvoices } from "../invoicesUtils";

/**
 * Custom hook for searching and filtering invoices
 */
export function useInvoiceFilters(invoices = []) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filteredInvoices = useMemo(() => {
    return filterInvoices(invoices, { searchTerm, filterType });
  }, [invoices, searchTerm, filterType]);

  return {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filteredInvoices
  };
}

export default useInvoiceFilters;

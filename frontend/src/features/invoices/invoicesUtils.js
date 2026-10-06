/**
 * Pure utility functions for the Invoices domain
 */

/**
 * Filter invoices by search term (customer name, number, document) and type
 */
export function filterInvoices(invoices = [], { searchTerm = "", filterType = "all" } = {}) {
  return invoices.filter((inv) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      inv.customerName?.toLowerCase().includes(term) ||
      inv.number?.toLowerCase().includes(term) ||
      inv.customerDocument?.toLowerCase().includes(term);
    const matchesType = filterType === "all" || inv.type === filterType;
    return matchesSearch && matchesType;
  });
}

/**
 * Calculates aggregate invoice metrics (total billed, total boletas, total facturas, canceled count)
 */
export function calculateInvoiceMetrics(invoices = []) {
  let totalBilled = 0;
  let boletaCount = 0;
  let facturaCount = 0;
  let canceledCount = 0;

  invoices.forEach((inv) => {
    if (inv.status === "Anulada") {
      canceledCount += 1;
    } else {
      totalBilled += Number(inv.total) || 0;
      if (inv.type === "Boleta") boletaCount += 1;
      if (inv.type === "Factura") facturaCount += 1;
    }
  });

  return {
    totalBilled,
    boletaCount,
    facturaCount,
    canceledCount,
    totalCount: invoices.length
  };
}

/**
 * Formats next invoice number with padding (e.g. 000001)
 */
export function formatNextInvoiceNumber(invoices = [], type = "Boleta", padLength = 6) {
  const count = invoices.filter((i) => i.type === type).length + 1;
  return count.toString().padStart(padLength, "0");
}

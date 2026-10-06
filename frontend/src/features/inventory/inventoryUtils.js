/**
 * Pure utility functions for the Inventory / Kardex domain
 */

/**
 * Filters Kardex records for a specific product ID
 */
export function filterKardexByProduct(kardex = [], productId) {
  if (!productId) return kardex;
  return kardex.filter((k) => k.productId === productId);
}

/**
 * Sorts Kardex records chronologically or in reverse order
 */
export function sortKardexByDate(kardex = [], ascending = false) {
  return [...kardex].sort((a, b) => {
    const dateA = new Date(a.date || a.createdAt || 0).getTime();
    const dateB = new Date(b.date || b.createdAt || 0).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
}

/**
 * Calculates sum of inputs (Ingreso), outputs (Salida), and net balance
 */
export function calculateKardexTotals(kardex = [], productId = null) {
  const records = productId ? filterKardexByProduct(kardex, productId) : kardex;

  let totalEntries = 0;
  let totalExits = 0;

  records.forEach((entry) => {
    const qty = Number(entry.quantity) || 0;
    if (entry.type === "Ingreso") {
      totalEntries += qty;
    } else if (entry.type === "Salida") {
      totalExits += qty;
    }
  });

  return {
    totalEntries,
    totalExits,
    netBalance: totalEntries - totalExits,
    count: records.length
  };
}

/**
 * Normalizes Kardex entry object
 */
export function normalizeKardexEntry(entry = {}) {
  return {
    id: entry._id || entry.id || `k-${Date.now()}`,
    productId: entry.productId || "",
    productName: entry.productName || "",
    date: entry.date || new Date().toISOString().split("T")[0],
    type: entry.type === "Salida" ? "Salida" : "Ingreso",
    quantity: Number(entry.quantity) || 0,
    reason: entry.reason || "Ajuste de inventario",
    documentRef: entry.documentRef || "",
    location: entry.location || "Almacén Principal",
    finalStock: Number(entry.finalStock) || 0
  };
}

import { getKardexApi, addStockApi } from "./inventoryApi";
import { filterKardexByProduct, sortKardexByDate, calculateKardexTotals } from "./inventoryUtils";

/**
 * Inventory / Kardex Domain Service Layer
 * Abstraction for stock registration, movements analysis and retrieval
 */
export const inventoryService = {
  /**
   * Fetches all Kardex movements from the server
   */
  async fetchKardex() {
    try {
      const data = await getKardexApi();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("inventoryService.fetchKardex error:", err);
      return [];
    }
  },

  /**
   * Registers a manual stock entry (Ingreso de stock)
   */
  async addStock(idOrParams, quantity, reason, documentRef, location) {
    return addStockApi(idOrParams, quantity, reason, documentRef, location);
  },

  /**
   * Gets Kardex entries filtered by product
   */
  getKardexByProduct(kardex, productId) {
    return filterKardexByProduct(kardex, productId);
  },

  /**
   * Gets sorted Kardex entries
   */
  getSortedKardex(kardex, ascending = false) {
    return sortKardexByDate(kardex, ascending);
  },

  /**
   * Computes totals for entries, exits and balance
   */
  getKardexTotals(kardex, productId = null) {
    return calculateKardexTotals(kardex, productId);
  }
};

export default inventoryService;

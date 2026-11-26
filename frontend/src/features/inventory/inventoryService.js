import { getKardexApi, addStockApi } from "./inventoryApi";

/**
 * Inventory / Kardex Domain Service Layer
 * Abstraction for stock registration and movement retrieval
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
  }
};

export default inventoryService;

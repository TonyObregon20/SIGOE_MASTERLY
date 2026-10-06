import { getProductionOrdersApi, createProductionOrderApi, updateProductionStageApi } from "./productionApi";
import { buildProductionOrderPayload, calculateStageProgression, filterActiveProductionOrders, countFinishedProductionOrders } from "./productionUtils";

/**
 * Production Domain Service Layer
 * Encapsulates production orders (OP) lifecycle, stage progressions, and data transformations
 */
export const productionService = {
  /**
   * Fetches all production orders from the server
   */
  async fetchProductionOrders() {
    try {
      const data = await getProductionOrdersApi();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("productionService.fetchProductionOrders error:", err);
      return [];
    }
  },

  /**
   * Creates a new Production Order
   * Accepts either an existing OP object or an items array + orderId + responsible
   */
  async createProductionOrder(itemsOrPayload, orderId = "", responsible = "Operario de Tendido") {
    let payload;
    if (itemsOrPayload && itemsOrPayload.id && itemsOrPayload.stages) {
      // It is already a formatted payload
      payload = itemsOrPayload;
    } else {
      payload = buildProductionOrderPayload({
        items: itemsOrPayload || [],
        orderId,
        responsible
      });
    }

    return createProductionOrderApi(payload);
  },

  /**
   * Calculates new stage metadata and submits stage update to the server
   */
  async updateStage({ op, stageName, status, responsible, supplierId = "", extraData = {} }) {
    if (!op) {
      throw new Error("Production Order is required to update stage");
    }

    const mergedExtraData = {
      sublots: op.sublots,
      ...extraData
    };

    const { newStages, progress, nextStage, newSublots } = calculateStageProgression(
      op.stages || [],
      stageName,
      status,
      responsible,
      op.currentStage,
      supplierId,
      mergedExtraData
    );

    return updateProductionStageApi({
      opId: op.id,
      stageName,
      status,
      responsible,
      supplierId,
      progress,
      currentStage: nextStage,
      stages: newStages,
      sublots: newSublots !== undefined ? newSublots : op.sublots
    });
  },

  /**
   * Helper to build production order payload
   */
  prepareProductionOrder(params) {
    return buildProductionOrderPayload(params);
  },

  /**
   * Helper to filter active orders
   */
  getActiveOrders(productionOrders) {
    return filterActiveProductionOrders(productionOrders);
  },

  /**
   * Helper to count finished orders
   */
  getFinishedCount(productionOrders) {
    return countFinishedProductionOrders(productionOrders);
  }
};

export default productionService;

import { apiClient } from "@/services/api/apiClient";

/**
 * Production HTTP Communication Layer
 * Interacts with backend /api/production-orders endpoints
 */

export async function getProductionOrdersApi() {
  return apiClient("/api/production-orders");
}

export async function createProductionOrderApi(productionOrder) {
  return apiClient("/api/production-orders", {
    method: "POST",
    body: JSON.stringify(productionOrder)
  });
}

export async function updateProductionStageApi({ opId, stageName, status, responsible, progress, currentStage, stages, supplierId, sublots }) {
  return apiClient("/api/production-orders/update-stage", {
    method: "POST",
    body: JSON.stringify({
      opId,
      stageName,
      status,
      responsible,
      supplierId,
      progress,
      currentStage,
      stages,
      sublots
    })
  });
}

// Backwards compatibility aliases
export const updateStageApi = updateProductionStageApi;


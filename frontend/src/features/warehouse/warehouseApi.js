import { apiClient } from "@/services/api/apiClient";

/**
 * Warehouse Movements HTTP Communication Layer
 * Interacts with backend /api/warehouse-movements endpoints
 */

export async function getWarehouseMovementsApi() {
  return apiClient("/api/warehouse-movements");
}

export async function acceptWarehouseMovementApi(movementId) {
  return apiClient("/api/warehouse-movements/accept", {
    method: "POST",
    body: JSON.stringify({ movementId })
  });
}

export async function createSalidaMovementApi(payload) {
  const body = typeof payload === "string" ? { orderId: payload } : payload;
  return apiClient("/api/warehouse-movements/create-salida", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function createIngresoMovementApi(payload) {
  const body = typeof payload === "string" ? { opId: payload } : payload;
  return apiClient("/api/warehouse-movements/create-ingreso", {
    method: "POST",
    body: JSON.stringify(body)
  });
}


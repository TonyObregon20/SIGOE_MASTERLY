import { apiClient } from "@/services/api/apiClient";

/**
 * Orders HTTP Communication Layer
 * Interacts with backend /api/orders endpoints
 */

export async function getOrdersApi() {
  return apiClient("/api/orders");
}

export async function createOrderApi({ order, docType = "Boleta", docNumber = "00000000", invoiceSeriesNumber = "000001" }) {
  return apiClient("/api/orders", {
    method: "POST",
    body: JSON.stringify({
      order,
      docType,
      docNumber,
      invoiceSeriesNumber
    })
  });
}

export async function shipOrderApi(orderId) {
  return apiClient("/api/orders/ship", {
    method: "POST",
    body: JSON.stringify({ orderId })
  });
}

// Backwards compatibility alias
export const checkoutOrderApi = createOrderApi;


import { apiClient } from "@/services/api/apiClient";

/**
 * Inventory / Kardex HTTP Communication Layer
 * Interacts with backend /api/kardex endpoints
 */

export async function getKardexApi() {
  return apiClient("/api/kardex");
}

export async function addStockApi(idOrParams, quantity, reason, documentRef, location) {
  let body;
  if (typeof idOrParams === "object" && idOrParams !== null) {
    body = {
      productId: idOrParams.productId || idOrParams.id,
      quantity: idOrParams.quantity,
      reason: idOrParams.reason,
      documentRef: idOrParams.documentRef,
      location: idOrParams.location
    };
  } else {
    body = {
      productId: idOrParams,
      quantity,
      reason,
      documentRef,
      location
    };
  }

  return apiClient("/api/kardex/add-stock", {
    method: "POST",
    body: JSON.stringify(body)
  });
}


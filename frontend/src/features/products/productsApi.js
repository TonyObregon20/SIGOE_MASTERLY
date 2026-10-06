import { apiClient } from "@/services/api/apiClient";

/**
 * Products API client functions for HTTP communication
 */

export async function getProductsApi() {
  return apiClient("/api/products");
}

export async function createProductApi(productData) {
  return apiClient("/api/products", {
    method: "POST",
    body: JSON.stringify(productData)
  });
}

export const addProductApi = createProductApi;

export async function updateProductApi(id, updates) {
  return apiClient("/api/products", {
    method: "POST",
    body: JSON.stringify({ id, ...updates })
  });
}

export async function deleteProductApi(id) {
  return apiClient(`/api/products/${id}`, {
    method: "DELETE"
  });
}


import { apiClient } from "@/services/api/apiClient";

/**
 * Suppliers HTTP Communication Layer
 * Interacts with backend /api/suppliers endpoints
 */

export async function getSuppliersApi() {
  return apiClient("/api/suppliers");
}

export async function createSupplierApi(supplierData) {
  return apiClient("/api/suppliers", {
    method: "POST",
    body: JSON.stringify(supplierData)
  });
}

export async function updateSupplierApi(id, supplierData) {
  return apiClient(`/api/suppliers/${id}`, {
    method: "PUT",
    body: JSON.stringify(supplierData)
  });
}

export async function deleteSupplierApi(id) {
  return apiClient(`/api/suppliers/${id}`, {
    method: "DELETE"
  });
}

export async function addSupplierRecordApi(id, recordData) {
  return apiClient(`/api/suppliers/${id}/records`, {
    method: "POST",
    body: JSON.stringify(recordData)
  });
}

export async function deleteSupplierRecordApi(id, recordId) {
  return apiClient(`/api/suppliers/${id}/records/${recordId}`, {
    method: "DELETE"
  });
}

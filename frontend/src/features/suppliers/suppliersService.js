import {
  getSuppliersApi,
  createSupplierApi,
  updateSupplierApi,
  deleteSupplierApi,
  addSupplierRecordApi,
  deleteSupplierRecordApi
} from "./suppliersApi";
import { filterSuppliers, normalizeSupplier } from "./suppliersUtils";

/**
 * Suppliers Domain Service Layer
 */
export const suppliersService = {
  /**
   * Fetches all suppliers from backend
   */
  async fetchSuppliers() {
    try {
      const data = await getSuppliersApi();
      return Array.isArray(data) ? data.map(normalizeSupplier) : [];
    } catch (err) {
      console.error("suppliersService.fetchSuppliers error:", err);
      return [];
    }
  },

  /**
   * Creates a new supplier
   */
  async addSupplier(supplierData) {
    const payload = normalizeSupplier(supplierData);
    return createSupplierApi(payload);
  },

  /**
   * Updates an existing supplier
   */
  async updateSupplier(id, supplierData) {
    const payload = normalizeSupplier(supplierData);
    return updateSupplierApi(id, payload);
  },

  /**
   * Deletes a supplier
   */
  async deleteSupplier(id) {
    return deleteSupplierApi(id);
  },

  /**
   * Adds a service/purchase record to a supplier
   */
  async addRecord(id, recordData) {
    return addSupplierRecordApi(id, recordData);
  },

  /**
   * Deletes a record from a supplier
   */
  async deleteRecord(id, recordId) {
    return deleteSupplierRecordApi(id, recordId);
  },

  /**
   * Utility for filtering suppliers
   */
  filterSuppliers(suppliers, options) {
    return filterSuppliers(suppliers, options);
  }
};

export default suppliersService;

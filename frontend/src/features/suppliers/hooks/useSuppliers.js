import { useState, useEffect, useCallback } from "react";
import { suppliersService } from "../suppliersService";

/**
 * Custom hook to manage Suppliers state and full CRUD operations
 */
export function useSuppliers(autoLoad = true) {
  const [suppliers, setSuppliersState] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await suppliersService.fetchSuppliers();
      if (Array.isArray(data)) {
        setSuppliersState(data);
      }
      return data;
    } catch (err) {
      console.error("Error loading suppliers:", err);
      setError(err.message || "Error al cargar proveedores");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const addSupplier = useCallback(async (supplierData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await suppliersService.addSupplier(supplierData);
      await loadSuppliers();
      return result;
    } catch (err) {
      console.error("Error adding supplier:", err);
      setError(err.message || "Error al agregar proveedor");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadSuppliers]);

  const updateSupplier = useCallback(async (id, supplierData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await suppliersService.updateSupplier(id, supplierData);
      await loadSuppliers();
      return result;
    } catch (err) {
      console.error("Error updating supplier:", err);
      setError(err.message || "Error al actualizar proveedor");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadSuppliers]);

  const deleteSupplier = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await suppliersService.deleteSupplier(id);
      await loadSuppliers();
      return result;
    } catch (err) {
      console.error("Error deleting supplier:", err);
      setError(err.message || "Error al eliminar proveedor");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadSuppliers]);

  const addRecord = useCallback(async (id, recordData) => {
    try {
      const result = await suppliersService.addRecord(id, recordData);
      await loadSuppliers();
      return result;
    } catch (err) {
      console.error("Error adding supplier record:", err);
      throw err;
    }
  }, [loadSuppliers]);

  const deleteRecord = useCallback(async (id, recordId) => {
    try {
      const result = await suppliersService.deleteRecord(id, recordId);
      await loadSuppliers();
      return result;
    } catch (err) {
      console.error("Error deleting supplier record:", err);
      throw err;
    }
  }, [loadSuppliers]);

  const setSuppliers = useCallback((updaterOrValue) => {
    if (typeof updaterOrValue === "function") {
      setSuppliersState((prevSuppliers) => {
        const nextSuppliers = updaterOrValue(prevSuppliers);
        return Array.isArray(nextSuppliers) ? nextSuppliers : prevSuppliers;
      });
    } else {
      setSuppliersState(updaterOrValue);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      loadSuppliers();
    }
  }, [autoLoad, loadSuppliers]);

  return {
    suppliers,
    setSuppliers,
    loading,
    error,
    loadSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addRecord,
    deleteRecord
  };
}

export default useSuppliers;

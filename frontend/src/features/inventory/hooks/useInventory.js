import { useState, useEffect, useCallback } from "react";
import { inventoryService } from "../inventoryService";

/**
 * Custom hook to manage Kardex and inventory stock movements
 */
export function useInventory(autoLoad = true) {
  const [kardex, setKardex] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadKardex = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryService.fetchKardex();
      if (Array.isArray(data)) {
        setKardex(data);
      }
      return data;
    } catch (err) {
      console.error("Error loading Kardex data:", err);
      setError(err.message || "Error al cargar movimientos de Kardex");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const addStock = useCallback(async (idOrParams, quantity, reason, documentRef, location) => {
    setLoading(true);
    setError(null);
    try {
      const result = await inventoryService.addStock(idOrParams, quantity, reason, documentRef, location);
      if (result && result.success) {
        await loadKardex();
      }
      return result;
    } catch (err) {
      console.error("Error registering stock in Kardex:", err);
      setError(err.message || "Error al registrar ingreso de stock");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadKardex]);

  useEffect(() => {
    if (autoLoad) {
      loadKardex();
    }
  }, [autoLoad, loadKardex]);

  return {
    kardex,
    setKardex,
    loading,
    error,
    loadKardex,
    addStock
  };
}

export default useInventory;

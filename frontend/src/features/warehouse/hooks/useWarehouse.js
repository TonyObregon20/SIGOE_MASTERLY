import { useState, useEffect, useCallback } from "react";
import { warehouseService } from "../warehouseService";

/**
 * Custom hook to manage Warehouse Movements state and operations
 */
export function useWarehouse(autoLoad = true) {
  const [warehouseMovements, setWarehouseMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadWarehouseMovements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await warehouseService.fetchMovements();
      if (Array.isArray(data)) {
        setWarehouseMovements(data);
      }
      return data;
    } catch (err) {
      console.error("Error loading warehouse movements:", err);
      setError(err.message || "Error al cargar movimientos de almacén");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptMovement = useCallback(async (movementId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await warehouseService.acceptMovement(movementId);
      if (result && result.success) {
        await loadWarehouseMovements();
      }
      return result;
    } catch (err) {
      console.error("Error accepting warehouse movement:", err);
      setError(err.message || "Error al aceptar movimiento de almacén");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadWarehouseMovements]);

  const createSalida = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await warehouseService.createSalida(payload);
      if (result && result.success) {
        await loadWarehouseMovements();
      }
      return result;
    } catch (err) {
      console.error("Error creating salida movement:", err);
      setError(err.message || "Error al crear salida de almacén");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadWarehouseMovements]);

  const createIngreso = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await warehouseService.createIngreso(payload);
      if (result && result.success) {
        await loadWarehouseMovements();
      }
      return result;
    } catch (err) {
      console.error("Error creating ingreso movement:", err);
      setError(err.message || "Error al crear ingreso de almacén");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadWarehouseMovements]);

  useEffect(() => {
    if (autoLoad) {
      loadWarehouseMovements();
    }
  }, [autoLoad, loadWarehouseMovements]);

  return {
    warehouseMovements,
    setWarehouseMovements,
    loading,
    error,
    loadWarehouseMovements,
    acceptMovement,
    createSalida,
    createIngreso
  };
}

export default useWarehouse;

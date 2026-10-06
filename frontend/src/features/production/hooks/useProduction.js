import { useState, useEffect, useCallback } from "react";
import { productionService } from "../productionService";
import { calculateStageProgression } from "../productionUtils";

/**
 * Custom hook to manage Production Orders (OP) state, lifecycle, and stage transitions
 */
export function useProduction(autoLoad = true) {
  const [productionOrders, setProductionOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadProductionOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productionService.fetchProductionOrders();
      if (Array.isArray(data)) {
        setProductionOrders(data);
      }
      return data;
    } catch (err) {
      console.error("Error loading production orders:", err);
      setError(err.message || "Error al cargar órdenes de producción");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createProductionOrder = useCallback(async (items, orderId = "", responsible = "Operario de Tendido") => {
    setLoading(true);
    setError(null);
    try {
      const result = await productionService.createProductionOrder(items, orderId, responsible);
      if (result && result.success) {
        if (result.productionOrder) {
          setProductionOrders((prev) => [
            result.productionOrder,
            ...prev.filter((o) => o.id !== result.productionOrder.id)
          ]);
        } else {
          await loadProductionOrders();
        }
      }
      return result;
    } catch (err) {
      console.error("Error creating production order:", err);
      setError(err.message || "Error al crear orden de producción");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadProductionOrders]);

  const updateStage = useCallback(async (opId, stageName, status, responsible, supplierId = "", extraData = {}) => {
    setError(null);
    const op = productionOrders.find((o) => o.id === opId);
    if (!op) {
      throw new Error(`Production order ${opId} not found`);
    }

    // 1. Calculate optimistic stage progression for INSTANT (<1ms) UI feedback
    const mergedExtraData = {
      sublots: op.sublots,
      ...extraData
    };
    const { newStages, progress, nextStage, newSublots } = calculateStageProgression(
      op.stages || [],
      stageName,
      status,
      responsible,
      op.currentStage,
      supplierId,
      mergedExtraData
    );

    const optimisticOp = {
      ...op,
      stages: newStages,
      progress,
      currentStage: nextStage,
      ...(newSublots !== undefined ? { sublots: newSublots } : {})
    };

    // Optimistically update React state immediately
    setProductionOrders((prev) =>
      prev.map((o) => (o.id === opId ? optimisticOp : o))
    );

    try {
      // 2. Perform backend update in background
      const result = await productionService.updateStage({
        op,
        stageName,
        status,
        responsible,
        supplierId,
        extraData
      });

      if (result && result.success && result.productionOrder) {
        // Reconcile with canonical server record
        setProductionOrders((prev) =>
          prev.map((o) => (o.id === opId ? result.productionOrder : o))
        );
      }
      return result;
    } catch (err) {
      console.error("Error updating stage:", err);
      // Rollback on failure
      setProductionOrders((prev) =>
        prev.map((o) => (o.id === opId ? op : o))
      );
      setError(err.message || "Error al actualizar etapa de producción");
      throw err;
    }
  }, [productionOrders]);

  useEffect(() => {
    if (autoLoad) {
      loadProductionOrders();
    }
  }, [autoLoad, loadProductionOrders]);

  return {
    productionOrders,
    setProductionOrders,
    loading,
    error,
    loadProductionOrders,
    createProductionOrder,
    updateStage
  };
}

export default useProduction;

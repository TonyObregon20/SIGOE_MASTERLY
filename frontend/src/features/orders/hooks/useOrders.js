import { useState, useEffect, useCallback } from "react";
import { ordersService } from "../ordersService";

/**
 * Custom hook to manage orders state, loading, errors and domain operations.
 */
export function useOrders(autoLoad = true) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ordersService.fetchOrders();
      if (Array.isArray(data)) {
        setOrders(data);
      }
      return data;
    } catch (err) {
      console.error("Error loading orders:", err);
      setError(err.message || "Error al cargar pedidos");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrder = useCallback(async ({ order, docType, docNumber, invoiceSeriesNumber, productionOrder }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ordersService.createOrder({ order, docType, docNumber, invoiceSeriesNumber, productionOrder });
      if (result && result.success) {
        if (result.order) {
          setOrders((prev) => [result.order, ...prev.filter((o) => o.id !== result.order.id)]);
        } else {
          await loadOrders();
        }
      }
      return result;
    } catch (err) {
      console.error("Error creating order:", err);
      setError(err.message || "Error al crear pedido");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadOrders]);

  const shipOrder = useCallback(async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ordersService.shipOrder(orderId);
      if (result && result.success) {
        if (result.order) {
          setOrders((prev) => prev.map((o) => (o.id === orderId ? result.order : o)));
        } else {
          await loadOrders();
        }
      }
      return result;
    } catch (err) {
      console.error("Error shipping order:", err);
      setError(err.message || "Error al despachar pedido");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadOrders]);

  useEffect(() => {
    if (autoLoad) {
      loadOrders();
    }
  }, [autoLoad, loadOrders]);

  return {
    orders,
    setOrders,
    loading,
    error,
    loadOrders,
    createOrder,
    shipOrder
  };
}

export default useOrders;

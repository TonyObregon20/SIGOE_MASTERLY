import { useState, useCallback } from "react";
import { checkoutService } from "../checkoutService";

/**
 * Custom hook to encapsulate the checkout execution lifecycle, loading state, error handling,
 * and completed order confirmation data.
 */
export function useCheckout({
  currentUser,
  cart,
  cartTotal,
  invoices = [],
  invoiceSeries,
  onProductsReload,
  onInvoicesReload,
  onOrdersReload,
  onOrderCreated,
  onProductionReload,
  onProductionOrderCreated,
  onInvoiceCreated,
  onWarehouseReload,
  onCartClear,
  onRequireAuth,
  onSuccess
} = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [completedOrderData, setCompletedOrderData] = useState(null);

  const checkout = useCallback(
    async (type = "direct", docType = "Boleta", docNumber = "00000000") => {
      if (!currentUser) {
        if (typeof onRequireAuth === "function") {
          onRequireAuth();
        }
        return { success: false, reason: "AUTH_REQUIRED" };
      }

      setLoading(true);
      setError(null);

      try {
        const result = await checkoutService.processCheckout({
          currentUser,
          cart,
          cartTotal,
          invoices,
          type,
          docType,
          docNumber,
          customSeries: invoiceSeries,
          onProductsReload,
          onInvoicesReload,
          onOrdersReload,
          onOrderCreated,
          onProductionReload,
          onProductionOrderCreated,
          onInvoiceCreated,
          onWarehouseReload,
          onCartClear
        });

        if (result && result.success) {
          setCompletedOrderData(result.completedOrderData);
          if (typeof onSuccess === "function") {
            onSuccess(result.completedOrderData);
          }
        }

        return result;
      } catch (err) {
        console.error("Error submitting order checkout:", err);
        setError(err.message || "Error al procesar el checkout");
        return { success: false, error: err };
      } finally {
        setLoading(false);
      }
    },
    [
      currentUser,
      cart,
      cartTotal,
      invoices,
      invoiceSeries,
      onProductsReload,
      onInvoicesReload,
      onOrdersReload,
      onOrderCreated,
      onProductionReload,
      onProductionOrderCreated,
      onInvoiceCreated,
      onWarehouseReload,
      onCartClear,
      onRequireAuth,
      onSuccess
    ]
  );

  const clearCompletedOrder = useCallback(() => {
    setCompletedOrderData(null);
  }, []);

  return {
    checkout,
    loading,
    error,
    completedOrderData,
    setCompletedOrderData,
    clearCompletedOrder
  };
}

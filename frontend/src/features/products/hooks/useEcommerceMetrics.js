import { useMemo } from "react";
import { calculateEcommerceMetrics } from "../productsUtils";

/**
 * Custom hook to memoize Ecommerce KPI calculations
 */
export function useEcommerceMetrics({ products = [], orders = [] }) {
  return useMemo(() => {
    return calculateEcommerceMetrics(products, orders);
  }, [products, orders]);
}


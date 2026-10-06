import { useMemo } from "react";
import { dashboardService } from "../dashboardService";

/**
 * Hook to compute and memoize dashboard KPI summaries
 */
export function useDashboard({ products = [], productionOrders = [], users = [], orders = [] } = {}) {
  const summary = useMemo(() => {
    return dashboardService.getSummaryKPIs({ products, productionOrders, users, orders });
  }, [products, productionOrders, users, orders]);

  return summary;
}

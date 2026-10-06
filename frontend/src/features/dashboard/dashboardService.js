import {
  calculateLowStock,
  calculateActiveOPs,
  calculateTotalSales,
  calculateTotalCustomers,
  calculateProductionMetrics
} from "./dashboardUtils";

/**
 * Service to aggregate dashboard KPIs and analytics across domains
 */
export const dashboardService = {
  getSummaryKPIs({ products = [], productionOrders = [], users = [], orders = [] }) {
    const lowStock = calculateLowStock(products);
    const activeOPs = calculateActiveOPs(productionOrders);
    const totalSales = calculateTotalSales(orders);
    const totalCustomers = calculateTotalCustomers(users);
    const productionMetrics = calculateProductionMetrics(productionOrders);

    return {
      lowStock,
      activeOPs,
      totalSales,
      totalCustomers,
      productionMetrics
    };
  }
};

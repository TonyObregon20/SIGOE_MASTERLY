import { getOrdersApi, createOrderApi, shipOrderApi } from "./ordersApi";
import { buildOrderPayload, filterOrdersByCustomer, calculateTotalSales } from "./ordersUtils";

/**
 * Orders Domain Service Layer
 * Encapsulates order workflows, validation and data preparation
 */
export const ordersService = {
  /**
   * Fetches all orders from the server
   */
  async fetchOrders() {
    try {
      const data = await getOrdersApi();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("ordersService.fetchOrders error:", err);
      return [];
    }
  },

  /**
   * Submits a new order during checkout
   */
  async createOrder({ order, docType, docNumber, invoiceSeriesNumber }) {
    return createOrderApi({ order, docType, docNumber, invoiceSeriesNumber });
  },

  /**
   * Dispatches / ships an order
   */
  async shipOrder(orderId) {
    return shipOrderApi(orderId);
  },

  /**
   * Helper to build order data structure from cart & context
   */
  prepareOrder(params) {
    return buildOrderPayload(params);
  },

  /**
   * Helper to filter user orders
   */
  getUserOrders(orders, currentUser) {
    return filterOrdersByCustomer(orders, currentUser);
  },

  /**
   * Helper to get total sales
   */
  getTotalSales(orders) {
    return calculateTotalSales(orders);
  }
};

export default ordersService;

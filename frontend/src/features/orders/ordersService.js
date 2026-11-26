import { getOrdersApi, createOrderApi, shipOrderApi } from "./ordersApi";

/**
 * Orders Domain Service Layer
 * Encapsulates API operations for orders
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
  async createOrder({ order, docType, docNumber, invoiceSeriesNumber, productionOrder }) {
    return createOrderApi({ order, docType, docNumber, invoiceSeriesNumber, productionOrder });
  },

  /**
   * Dispatches / ships an order
   */
  async shipOrder(orderId) {
    return shipOrderApi(orderId);
  }
};

export default ordersService;

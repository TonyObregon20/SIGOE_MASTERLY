import { ordersService } from "@/features/orders/ordersService";
import { productionService } from "@/features/production/productionService";
import {
  INVOICE_SERIES,
  generateOrderId,
  calculateNextInvoiceNumber,
  buildOrderPayload,
  buildCompletedOrderData
} from "./checkoutUtils";

/**
 * Checkout Orchestration Service
 * Coordinates the full checkout workflow across orders, production, products, invoices, and cart
 */
export const checkoutService = {
  /**
   * Orchestrates the complete checkout flow
   */
  async processCheckout({
    currentUser,
    cart,
    cartTotal,
    invoices = [],
    type = "direct",
    docType = "Boleta",
    docNumber = "00000000",
    customSeries = INVOICE_SERIES,
    onProductsReload,
    onInvoicesReload,
    onOrdersReload,
    onOrderCreated,
    onProductionReload,
    onProductionOrderCreated,
    onInvoiceCreated,
    onWarehouseReload,
    onCartClear
  }) {
    if (!currentUser) {
      throw new Error("Se requiere autenticación para procesar la compra.");
    }

    if (!cart || cart.length === 0) {
      throw new Error("El carrito se encuentra vacío.");
    }

    const orderId = generateOrderId();
    const newOrder = buildOrderPayload({
      orderId,
      currentUser,
      cart,
      cartTotal,
      type
    });

    const series = docType === "Boleta" ? (customSeries.BOLETA || "B001") : (customSeries.FACTURA || "F001");
    const invoiceNum = calculateNextInvoiceNumber(invoices, docType);

    // Build Production Order payload in advance for on-demand purchases
    let productionOrderPayload = null;
    if (type !== "direct") {
      const productionItems = cart.map((i) => ({
        product: i.product,
        quantity: i.quantity,
        selectedSize: i.selectedSize,
        sizeDistribution: i.sizeDistribution
      }));
      productionOrderPayload = productionService.prepareProductionOrder({
        items: productionItems,
        orderId,
        responsible: "Operario de Tendido"
      });
    }

    // 1. Create order and trigger invoice registration (and atomic OP if on-demand) on backend
    const orderResult = await ordersService.createOrder({
      order: newOrder,
      docType,
      docNumber,
      invoiceSeriesNumber: invoiceNum,
      productionOrder: productionOrderPayload
    });

    if (!orderResult || !orderResult.success) {
      throw new Error(orderResult?.message || "No se pudo procesar la orden de compra.");
    }

    let createdOP = orderResult.productionOrder;

    // Fallback: If backend didn't return an OP for on-demand order, create via productionService
    if (!createdOP && type !== "direct" && productionOrderPayload) {
      try {
        const opResult = await productionService.createProductionOrder(productionOrderPayload);
        if (opResult && opResult.productionOrder) {
          createdOP = opResult.productionOrder;
        }
      } catch (opErr) {
        console.error("Secondary production order creation error:", opErr);
      }
    }

    // 2. Immediately update state in memory for instant reactivity (no page reload needed)
    if (typeof onOrderCreated === "function") {
      onOrderCreated(orderResult.order || newOrder);
    }
    if (createdOP && typeof onProductionOrderCreated === "function") {
      onProductionOrderCreated(createdOP);
    }
    if (orderResult.invoice && typeof onInvoiceCreated === "function") {
      onInvoiceCreated(orderResult.invoice);
    }

    // 3. Clear cart
    if (typeof onCartClear === "function") {
      onCartClear();
    }

    // 4. Build completed order receipt data
    const completedData = buildCompletedOrderData({
      orderId,
      docType,
      docNumber,
      series,
      invoiceNumber: invoiceNum,
      currentUser,
      cart,
      cartTotal,
      type
    });

    // 5. Trigger non-blocking domain synchronization in the background
    Promise.allSettled([
      typeof onOrdersReload === "function" ? onOrdersReload() : null,
      typeof onProductionReload === "function" ? onProductionReload() : null,
      typeof onProductsReload === "function" ? onProductsReload() : null,
      typeof onInvoicesReload === "function" ? onInvoicesReload() : null,
      typeof onWarehouseReload === "function" ? onWarehouseReload() : null
    ]).catch(() => {});

    return {
      success: true,
      completedOrderData: completedData
    };
  }
};

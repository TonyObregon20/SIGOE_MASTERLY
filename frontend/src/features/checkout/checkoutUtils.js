/**
 * Pure utility functions for the Checkout domain
 * Handles payload construction, invoice numbering, dates, installments and confirmation data
 */

export const INVOICE_SERIES = {
  BOLETA: "B001",
  FACTURA: "F001"
};

/**
 * Generates an order ID
 */
export function generateOrderId() {
  return `ORD-${Date.now().toString().slice(-4)}`;
}

/**
 * Calculates next invoice series number based on invoice list and document type
 */
export function calculateNextInvoiceNumber(invoices = [], docType = "Boleta", padLength = 6) {
  const count = invoices.filter((i) => i.type === docType).length + 1;
  return count.toString().padStart(padLength, "0");
}

/**
 * Calculates estimated delivery date for on-demand orders (14 days ahead)
 */
export function calculateEstimatedDelivery(daysAhead = 14) {
  return new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
}

/**
 * Calculates installment schedules for on-demand orders (30 and 60 days)
 */
export function calculateInstallments(total) {
  const installmentAmount = total * 0.25;
  const dueDate1 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const dueDate2 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  return [
    { total: 2, paid: 0, amount: installmentAmount, dueDate: dueDate1 },
    { total: 2, paid: 0, amount: installmentAmount, dueDate: dueDate2 }
  ];
}

/**
 * Builds the newOrder payload to be sent to orders service
 */
export function buildOrderPayload({
  orderId,
  currentUser,
  cart,
  cartTotal,
  type = "direct"
}) {
  const isPedido = type === "pedido";

  return {
    id: orderId,
    userId: currentUser.id,
    customerName: currentUser.name,
    items: cart.map((i) => ({
      productId: i.product.id,
      quantity: i.quantity,
      price: i.product.price,
      selectedSize: i.selectedSize,
      sizeDistribution: i.sizeDistribution
    })),
    total: cartTotal,
    type,
    status: isPedido ? "Pagado Parcial" : "Pagado Total",
    date: new Date().toISOString().split("T")[0],
    initialPayment: isPedido ? cartTotal * 0.5 : undefined,
    estimatedDelivery: isPedido ? calculateEstimatedDelivery(14) : undefined,
    installments: isPedido ? calculateInstallments(cartTotal) : undefined
  };
}

/**
 * Builds the completed order confirmation data for OrderSuccessModal and receipt generation
 */
export function buildCompletedOrderData({
  orderId,
  docType,
  docNumber,
  series,
  invoiceNumber,
  currentUser,
  cart,
  cartTotal,
  type
}) {
  return {
    orderId,
    docType,
    docNumber,
    series,
    invoiceNumber,
    customerName: currentUser?.name || "",
    customerEmail: currentUser?.email || "",
    items: cart.map((i) => ({
      productName: i.product.name,
      quantity: i.quantity,
      price: i.product.price,
      selectedSize: i.selectedSize,
      sizeDistribution: i.sizeDistribution
    })),
    total: cartTotal,
    type,
    date: new Date().toISOString().split("T")[0],
    initialPayment: type === "pedido" ? cartTotal * 0.5 : undefined
  };
}

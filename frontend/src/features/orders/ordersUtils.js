/**
 * Pure utility functions for orders domain
 */

/**
 * Generates a unique short order ID matching the pattern ORD-XXXX
 */
export function generateOrderId() {
  return `ORD-${Date.now().toString().slice(-4)}`;
}

/**
 * Builds standard order object from cart and user context
 */
export function buildOrderPayload({ currentUser, cart = [], cartTotal = 0, type = "direct" }) {
  const orderId = generateOrderId();
  return {
    id: orderId,
    userId: currentUser?.id,
    customerName: currentUser?.name || "Cliente",
    items: cart.map((i) => ({
      productId: i.product.id,
      quantity: i.quantity,
      price: i.product.price,
      selectedSize: i.selectedSize,
      sizeDistribution: i.sizeDistribution
    })),
    total: cartTotal,
    type,
    status: type === "pedido" ? "Pagado Parcial" : "Pagado Total",
    date: new Date().toISOString().split("T")[0],
    initialPayment: type === "pedido" ? cartTotal * 0.5 : undefined,
    estimatedDelivery: type === "pedido" ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0] : undefined,
    installments: type === "pedido" ? [
      { total: 2, paid: 0, amount: cartTotal * 0.25, dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0] },
      { total: 2, paid: 0, amount: cartTotal * 0.25, dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0] }
    ] : undefined
  };
}

/**
 * Filters orders belonging to a specific customer or user
 */
export function filterOrdersByCustomer(orders = [], currentUser) {
  if (!currentUser) return [];
  return orders.filter(
    (o) => o.userId === currentUser.id || o.customerName === currentUser.name
  );
}

/**
 * Calculates total monetary sales from an orders list
 */
export function calculateTotalSales(orders = []) {
  return orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
}

/**
 * Formats order status for display badge styling
 */
export function getOrderStatusBadge(status) {
  switch (status) {
    case "Pagado Total":
    case "Entregado":
    case "Despachado":
      return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", label: status };
    case "Pagado Parcial":
      return { bg: "bg-amber-50 text-amber-700 border-amber-200", label: status };
    case "Pendiente":
      return { bg: "bg-blue-50 text-blue-700 border-blue-200", label: status };
    default:
      return { bg: "bg-slate-50 text-slate-700 border-slate-200", label: status || "N/A" };
  }
}

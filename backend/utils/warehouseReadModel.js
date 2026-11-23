import { movementSummary } from "./guideValidation.js";

const plain = (value) => structuredClone(value?.toObject ? value.toObject() : value);
const number = (value, fallback = 0) => Number.isFinite(Number(value)) && value != null && value !== "" ? Number(value) : fallback;

export function normalizeMovement(value) {
  const movement = plain(value);
  const source = Array.isArray(movement.items) ? movement.items : [];
  const items = source.map((item) => ({
    ...item,
    quantity: number(item.quantity, number(item.quantityOrdered) + number(item.quantityExtras)),
    productName: item.productName || item.name || "Prenda"
  }));
  // Some old movements carry only a total quantity and a product reference.
  if (!items.length && number(movement.quantity) > 0) items.push({ productId: movement.productId, productName: movement.productName || "Prenda", selectedSize: movement.selectedSize, quantity: number(movement.quantity) });
  return movementSummary({
    ...movement, items,
    quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    status: movement.status || "Aceptado",
    date: movement.date || String(movement.createdAt || "").split("T")[0],
    originType: movement.originType || (movement.orderId ? "A Pedido" : "Autostock")
  });
}

export function warehouseReadModel(movements, orders, products = []) {
  const result = movements.map(normalizeMovement);
  for (const value of orders) {
    const order = plain(value);
    if (order.status !== "Enviado" || order.warehouseGuideVersion != null || result.some((m) => m.orderId === order.id && m.type === "Salida")) continue;
    const date = order.shippedAt || order.date || order.createdAt || "";
    result.push(normalizeMovement({
      id: `historical-order:${order.id}`, virtual: true, readOnly: true,
      type: "Salida", status: "Aceptado", orderId: order.id,
      originType: order.type === "pedido" ? "A Pedido" : "Venta Directa",
      date: String(date).split("T")[0], createdAt: date, processedAt: date,
      reason: `Despacho histórico del pedido ${order.id}`,
      items: (order.items || []).map((item) => ({ ...item,
        quantity: number(item.quantity, number(item.quantityOrdered) + number(item.quantityExtras) || 1),
        productName: products.find((p) => p.id === item.productId)?.name || item.productName || "Prenda"
      }))
    }));
  }
  return result;
}

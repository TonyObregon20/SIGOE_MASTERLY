export function formatOrderId(orderId = "") {
  const value = String(orderId);
  const legacyMatch = value.match(/^ORD-(\d+)-[A-Z0-9]+$/i);
  if (legacyMatch) {
    return `ORD-${legacyMatch[1].slice(-4)}`;
  }
  return value;
}

export function formatOrderId(orderId = "") {
  const value = String(orderId);
  const inPersonMatch = value.match(/^ORD-POS-([a-f0-9]{8})-/i);
  if (inPersonMatch) return `VP-${inPersonMatch[1].toUpperCase()}`;
  const legacyMatch = value.match(/^ORD-(\d+)-[A-Z0-9]+$/i);
  if (legacyMatch) {
    return `ORD-${legacyMatch[1].slice(-4)}`;
  }
  return value;
}

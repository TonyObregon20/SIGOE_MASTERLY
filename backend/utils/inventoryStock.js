import { flowError } from "./guideValidation.js";

// Only the received units are attributed to a size. Unallocated historical
// global stock is never silently assigned to a size or backfilled.
export function ingressStock(product, item, committed) {
  const qty = Number(item.quantity);
  if (!Number.isSafeInteger(qty) || qty <= 0) throw flowError("Las cantidades de ingreso deben ser enteros positivos.");
  const sizes = structuredClone(product.sizes || {});
  const size = item.selectedSize || "M";
  const previous = sizes[size];
  if (previous != null && (typeof previous !== "object" || Array.isArray(previous))) throw flowError(`La talla ${size} requiere conciliación de su formato histórico.`, 409);
  sizes[size] = {
    ...previous,
    stockPhysical: (Number(previous?.stockPhysical) || 0) + qty,
    stockCommitted: (Number(previous?.stockCommitted) || 0) + (committed ? qty : 0)
  };
  return {
    stockPhysical: (Number(product.stockPhysical) || 0) + qty,
    stockCommitted: (Number(product.stockCommitted) || 0) + (committed ? qty : 0),
    sizes
  };
}

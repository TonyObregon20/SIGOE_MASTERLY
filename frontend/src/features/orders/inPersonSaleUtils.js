export const IN_PERSON_SIZES = ["S", "M", "L", "XL"];
export const IN_PERSON_PAYMENT_METHODS = ["Efectivo", "Tarjeta", "Yape", "Plin", "Transferencia"];
export const todayInLima = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Lima" }).format(new Date());
export function inPersonSizeStock(product, size) {
  const stock = product?.sizes?.[size];
  if (stock == null) return 0;
  return Math.max(0, (Number(typeof stock === "number" ? stock : stock.stockPhysical) || 0) - (Number(typeof stock === "object" ? stock.stockCommitted : 0) || 0));
}
export const inPersonTotalStock = product => Math.max(0, (Number(product?.stockPhysical) || 0) - (Number(product?.stockCommitted) || 0));

export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return `S/ ${num.toFixed(2)}`;
}

export function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

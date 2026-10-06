/**
 * Pure utility functions for the Warehouse domain
 */

/**
 * Filters movements by status or type
 */
export function filterMovements(movements = [], { status = "all", type = "all" } = {}) {
  return movements.filter((mov) => {
    const matchesStatus = status === "all" || mov.status === status;
    const matchesType = type === "all" || mov.type === type;
    return matchesStatus && matchesType;
  });
}

/**
 * Calculates pending warehouse approval count and breakdown
 */
export function calculateWarehouseMetrics(movements = []) {
  let pendingCount = 0;
  let acceptedCount = 0;
  let ingresosCount = 0;
  let salidasCount = 0;

  movements.forEach((mov) => {
    if (mov.status === "pending" || mov.status === "Pendiente") {
      pendingCount += 1;
    } else {
      acceptedCount += 1;
    }

    if (mov.type === "Ingreso") {
      ingresosCount += 1;
    } else if (mov.type === "Salida") {
      salidasCount += 1;
    }
  });

  return {
    pendingCount,
    acceptedCount,
    ingresosCount,
    salidasCount,
    totalCount: movements.length
  };
}

/**
 * Normalizes warehouse movement object
 */
export function normalizeWarehouseMovement(movement = {}) {
  return {
    id: movement._id || movement.id || `WM-${Date.now()}`,
    type: movement.type || "Ingreso",
    productName: movement.productName || "",
    quantity: Number(movement.quantity) || 0,
    origin: movement.origin || "Producción",
    destination: movement.destination || "Almacén Central",
    status: movement.status || "pending",
    date: movement.date || new Date().toISOString().split("T")[0],
    referenceId: movement.referenceId || movement.orderId || movement.opId || ""
  };
}

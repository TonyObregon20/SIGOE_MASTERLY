import { STAGES } from "@/data/mockData";

/**
 * Pure calculations and transformation helpers for Admin Dashboard & Analytics
 */

/**
 * Calculates low stock alerts
 */
export function calculateLowStock(products = []) {
  return products.filter((p) => (p.stockPhysical || 0) - (p.stockCommitted || 0) <= (p.minStock || 0));
}

/**
 * Calculates active production orders
 */
export function calculateActiveOPs(productionOrders = []) {
  return productionOrders.filter((op) => op.currentStage !== "Finalizado");
}

/**
 * Calculates total sales amount
 */
export function calculateTotalSales(orders = []) {
  return orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
}

/**
 * Calculates total customer count
 */
export function calculateTotalCustomers(users = []) {
  return users.filter((u) => u.role === "customer").length;
}

/**
 * Computes general metrics for the production report
 */
export function calculateProductionMetrics(productionOrders = []) {
  const totalOPs = productionOrders.length;
  const finishedOPs = productionOrders.filter((op) => op.currentStage === "Finalizado");
  const activeOPs = productionOrders.filter((op) => op.currentStage !== "Finalizado");

  let totalUnitsInProcess = 0;
  let totalUnitsCompleted = 0;

  const sizeTally = { S: 0, M: 0, L: 0, XL: 0 };
  const stageUnits = {
    "Finalizado": 0
  };
  const stageStats = {
    "Finalizado": 0
  };
  STAGES.forEach((s) => {
    stageUnits[s] = 0;
    stageStats[s] = 0;
  });

  productionOrders.forEach((op) => {
    const isFinished = op.currentStage === "Finalizado";
    let opTotalUnits = 0;

    op.items?.forEach((item) => {
      const qty = (Number(item.quantityOrdered || item.quantity) || 0) + (Number(item.quantityExtras) || 0);
      opTotalUnits += qty;

      if (item.selectedSize) {
        if (sizeTally[item.selectedSize] !== undefined) {
          sizeTally[item.selectedSize] += qty;
        }
      } else if (item.sizeDistribution) {
        Object.entries(item.sizeDistribution).forEach(([size, sizeQty]) => {
          if (sizeTally[size] !== undefined) {
            sizeTally[size] += (Number(sizeQty) || 0);
          }
        });
      }
    });

    if (isFinished) {
      totalUnitsCompleted += opTotalUnits;
    } else {
      totalUnitsInProcess += opTotalUnits;
    }

    if (op.currentStage) {
      stageUnits[op.currentStage] = (stageUnits[op.currentStage] || 0) + opTotalUnits;
      stageStats[op.currentStage] = (stageStats[op.currentStage] || 0) + 1;
    }
  });

  const totalProductionUnits = totalUnitsInProcess + totalUnitsCompleted;

  return {
    totalOPs,
    finishedOPsCount: finishedOPs.length,
    activeOPsCount: activeOPs.length,
    totalUnitsInProcess,
    totalUnitsCompleted,
    totalProductionUnits,
    sizeTally,
    stageUnits,
    stageStats
  };
}

/**
 * Calculates replenish recommendation for low stock items
 */
export function calculateReplenishQty(p) {
  const currentStock = (p.stockPhysical || 0) - (p.stockCommitted || 0);
  const deficiency = (p.minStock || 0) - currentStock;
  return Math.max(30, Math.ceil((deficiency * 1.5) / 10) * 10);
}

/**
 * Generates standardized size distribution for replenish quantity
 */
export function getSizeDistribution(replenishQty) {
  const sizeDistribution = {
    S: Math.round(replenishQty * 0.2),
    M: Math.round(replenishQty * 0.3),
    L: Math.round(replenishQty * 0.3),
    XL: Math.round(replenishQty * 0.2)
  };
  const calculatedSum = sizeDistribution.S + sizeDistribution.M + sizeDistribution.L + sizeDistribution.XL;
  const difference = replenishQty - calculatedSum;
  if (difference !== 0) {
    sizeDistribution.M += difference;
  }
  return sizeDistribution;
}

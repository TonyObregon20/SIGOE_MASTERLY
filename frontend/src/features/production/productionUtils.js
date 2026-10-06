import { STAGES } from "@/data/mockData";

export const OP_STAGES = ["TODAS", ...STAGES, "Finalizado"];

/**
 * Returns Tailwind badge and dot color classes based on stage status
 */
export function getStatusColor(status) {
  switch (status) {
    case "completed":
      return "bg-emerald-500";
    case "in-progress":
      return "bg-blue-500 animate-pulse";
    default:
      return "bg-slate-200";
  }
}

/**
 * Pure utility functions for the Production domain (Órdenes de Producción - OP)
 */

/**
 * Generates a unique short Production Order ID matching the pattern OP-XXX
 */
export function generateProductionOrderId() {
  return `OP-${Math.floor(Math.random() * 1e3).toString().padStart(3, "0")}`;
}

/**
 * Builds a canonical Production Order payload from item lists and order context
 */
export function buildProductionOrderPayload({ items = [], orderId = "", responsible = "Operario de Tendido" }) {
  const opId = generateProductionOrderId();
  return {
    id: opId,
    orderId: orderId || "",
    items: items.map((i) => ({
      productId: i.product?.id || i.productId,
      productName: i.product?.name || i.productName || "Prenda",
      quantityOrdered: i.quantityOrdered !== undefined ? i.quantityOrdered : (i.quantity || 0),
      quantityExtras: i.quantityExtras || 0,
      selectedSize: i.selectedSize,
      sizeDistribution: i.sizeDistribution
    })),
    currentStage: STAGES[0] || "Tendido",
    progress: 0,
    startDate: new Date().toISOString().split("T")[0],
    stages: STAGES.map((s) => ({
      name: s,
      status: s === (STAGES[0] || "Tendido") ? "in-progress" : "pending",
      responsible: s === (STAGES[0] || "Tendido") ? (responsible || "Operario de Tendido") : "",
      supplierId: "",
      startTime: s === (STAGES[0] || "Tendido") ? new Date().toLocaleString() : ""
    }))
  };
}

/**
 * Calculates new stages, overall progress percentage, and the next active stage
 */
export function calculateStageProgression(stages = [], stageName, status, responsible, currentStage, supplierId = "", extraData = {}) {
  let currentIndex = STAGES.indexOf(stageName);
  if (currentIndex === -1 && stages.length > 0) {
    currentIndex = stages.findIndex((s) => s.name === stageName);
  }

  let newStages = stages;
  if (stageName) {
    newStages = stages.map((s) => {
      if (s.name === stageName) {
        return {
          ...s,
          status,
          responsible: responsible !== undefined ? responsible : s.responsible,
          supplierId: supplierId !== undefined ? supplierId : s.supplierId,
          supplierName: extraData?.supplierName || (supplierId ? responsible : s.supplierName),
          startTime: status === "in-progress" ? (s.startTime || new Date().toLocaleString()) : s.startTime,
          endTime: status === "completed" ? new Date().toLocaleString() : s.endTime
        };
      }
      return s;
    });
  }

  let newSublots = extraData?.sublots;

  // If update is targeting a specific sublot
  if (extraData?.sublotId && Array.isArray(newSublots)) {
    newSublots = newSublots.map((sub) => {
      if (sub.id === extraData.sublotId) {
        const subStages = (sub.stages || []).map((st) => {
          if (st.name === stageName) {
            return {
              ...st,
              status,
              responsible: responsible !== undefined ? responsible : st.responsible,
              supplierId: supplierId !== undefined ? supplierId : st.supplierId,
              supplierName: extraData?.supplierName || (supplierId ? responsible : st.supplierName),
              startTime: status === "in-progress" ? (st.startTime || new Date().toLocaleString()) : st.startTime,
              endTime: status === "completed" ? new Date().toLocaleString() : st.endTime
            };
          }
          return st;
        });

        // Determine sublot current stage & status
        let sublotNextStage = sub.currentStage;
        if (status === "completed") {
          const subIdx = STAGES.indexOf(stageName);
          if (subIdx !== -1 && subIdx < STAGES.length - 1) {
            sublotNextStage = STAGES[subIdx + 1];
            // Automatically set next stage to in-progress if pending
            const nextStg = subStages.find((st) => st.name === sublotNextStage);
            if (nextStg && nextStg.status === "pending") {
              nextStg.status = "in-progress";
              nextStg.startTime = new Date().toLocaleString();
            }
          } else {
            sublotNextStage = "Finalizado";
          }
        }

        const completedStagesCount = subStages.filter((st) => st.status === "completed").length;
        const sublotStatus = completedStagesCount === subStages.length ? "completed" : "in-progress";

        return {
          ...sub,
          stages: subStages,
          currentStage: sublotNextStage,
          status: sublotStatus
        };
      }
      return sub;
    });
  }

  // Calculate overall progress
  let progress = 0;
  if (Array.isArray(newSublots) && newSublots.length > 0) {
    const totalUnits = newSublots.reduce((sum, s) => sum + (Number(s.units) || 0), 0) || 1;
    let weightedCompleted = 0;
    newSublots.forEach((sub) => {
      const completedCount = (sub.stages || []).filter(st => st.status === "completed").length;
      const subProg = completedCount / (sub.stages?.length || STAGES.length);
      weightedCompleted += (Number(sub.units) || 0) * subProg;
    });
    progress = Math.round((weightedCompleted / totalUnits) * 100);
  } else {
    const totalStages = newStages.length > 0 ? newStages.length : STAGES.length;
    const completedCount = newStages.filter((s) => s.status === "completed").length;
    progress = Math.round((completedCount / totalStages) * 100);
  }

  let nextStage = currentStage;
  if (status === "completed") {
    if (currentIndex !== -1 && currentIndex < STAGES.length - 1) {
      nextStage = STAGES[currentIndex + 1];
    } else {
      nextStage = "Finalizado";
    }
  }

  return {
    newStages,
    progress,
    nextStage,
    newSublots
  };
}

/**
 * Filters active (non-finished) production orders
 */
export function filterActiveProductionOrders(productionOrders = []) {
  return productionOrders.filter((op) => op.currentStage !== "Finalizado");
}

/**
 * Counts finished production orders
 */
export function countFinishedProductionOrders(productionOrders = []) {
  return productionOrders.filter((op) => op.currentStage === "Finalizado").length;
}

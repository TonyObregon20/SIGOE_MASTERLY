import { useState, useMemo } from "react";
import { OP_STAGES } from "../productionUtils";

/**
 * Custom hook to manage search, filtering, and sorting state for Production Orders
 */
export function useProductionFilters({ productionOrders = [], salesOrders = [] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState("TODAS");
  const [selectedType, setSelectedType] = useState("TODOS"); // "TODOS", "PEDIDOS", "AUTOSTOCK"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // "newest", "oldest", "progress_desc", "progress_asc"
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const stageCounts = useMemo(() => {
    return OP_STAGES.reduce((acc, stg) => {
      if (stg === "TODAS") {
        acc[stg] = productionOrders.length;
      } else {
        acc[stg] = productionOrders.filter((op) => op.currentStage === stg).length;
      }
      return acc;
    }, {});
  }, [productionOrders]);

  const filteredOPs = useMemo(() => {
    return productionOrders.filter((op) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const opIdMatch = op.id?.toLowerCase().includes(q);
        const orderIdMatch = op.orderId?.toLowerCase().includes(q);
        const salesOrder = op.orderId ? salesOrders.find((o) => o.id === op.orderId) : null;
        const clientMatch = salesOrder?.customerName?.toLowerCase().includes(q);
        const itemMatch = op.items?.some((i) => i.productName?.toLowerCase().includes(q));
        if (!opIdMatch && !orderIdMatch && !clientMatch && !itemMatch) return false;
      }

      // 2. Stage Filter
      if (selectedStage !== "TODAS" && op.currentStage !== selectedStage) {
        return false;
      }

      // 3. Type Filter
      if (selectedType === "PEDIDOS" && (!op.orderId || op.orderId.includes("AUTO"))) {
        return false;
      }
      if (selectedType === "AUTOSTOCK" && op.orderId && !op.orderId.includes("AUTO")) {
        return false;
      }

      // 4. Date Filter
      if (startDate && op.startDate && op.startDate < startDate) return false;
      if (endDate && op.startDate && op.startDate > endDate) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === "newest") return new Date(b.startDate || 0) - new Date(a.startDate || 0);
      if (sortBy === "oldest") return new Date(a.startDate || 0) - new Date(b.startDate || 0);
      if (sortBy === "progress_desc") return (b.progress || 0) - (a.progress || 0);
      if (sortBy === "progress_asc") return (a.progress || 0) - (b.progress || 0);
      return 0;
    });
  }, [productionOrders, salesOrders, searchQuery, selectedStage, selectedType, startDate, endDate, sortBy]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    selectedStage !== "TODAS" ||
    selectedType !== "TODOS" ||
    startDate ||
    endDate
  );

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedStage("TODAS");
    setSelectedType("TODOS");
    setStartDate("");
    setEndDate("");
    setSortBy("newest");
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedStage,
    setSelectedStage,
    selectedType,
    setSelectedType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    sortBy,
    setSortBy,
    showAdvancedFilters,
    setShowAdvancedFilters,
    stageCounts,
    filteredOPs,
    hasActiveFilters,
    resetFilters,
    stagesList: OP_STAGES
  };
}

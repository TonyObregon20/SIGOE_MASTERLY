import { useState, useMemo } from "react";

/**
 * Custom hook to filter and count warehouse movements (Pendientes, Todos, Aceptados)
 */
export function useWarehouseMovementsFilter(warehouseMovements = []) {
  const [movementFilter, setMovementFilter] = useState("Pendientes");

  const pendingMovementsCount = useMemo(() => {
    return warehouseMovements.filter((m) => m.status === "Pendiente").length;
  }, [warehouseMovements]);

  const filteredMovements = useMemo(() => {
    return warehouseMovements.filter((m) => {
      if (movementFilter === "Pendientes") return m.status === "Pendiente";
      if (movementFilter === "Aceptados") return m.status === "Aceptado";
      return true; // Todos
    });
  }, [warehouseMovements, movementFilter]);

  return {
    movementFilter,
    setMovementFilter,
    pendingMovementsCount,
    filteredMovements
  };
}

export default useWarehouseMovementsFilter;

import {
  getWarehouseMovementsApi,
  acceptWarehouseMovementApi,
  createSalidaMovementApi,
  createIngresoMovementApi
} from "./warehouseApi";

/**
 * Warehouse Domain Service Layer
 */
export const warehouseService = {
  /**
   * Fetches all warehouse movements from the backend
   */
  async fetchMovements() {
    try {
      const data = await getWarehouseMovementsApi();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("warehouseService.fetchMovements error:", err);
      return [];
    }
  },

  /**
   * Accepts a pending warehouse movement (Ingreso or Salida)
   */
  async acceptMovement(movementId) {
    return acceptWarehouseMovementApi(movementId);
  },

  /**
   * Creates a salida movement for an order or OP
   */
  async createSalida(payload) {
    return createSalidaMovementApi(payload);
  },

  /**
   * Creates an ingreso movement for an OP or manual entry
   */
  async createIngreso(payload) {
    return createIngresoMovementApi(payload);
  }
};

export default warehouseService;

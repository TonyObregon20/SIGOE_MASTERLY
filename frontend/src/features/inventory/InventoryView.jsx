import React, { useState } from "react";
import { AnimatePresence } from "motion/react";
import { FileSpreadsheet } from "lucide-react";
import { useWarehouseMovementsFilter } from "./hooks/useWarehouseMovementsFilter";
import { useIncomeDraft } from "./hooks/useIncomeDraft";
import WarehouseMovementsSection from "./components/WarehouseMovementsSection";
import IncomeStockModal from "./components/IncomeStockModal";
import CreateIngresoModal from "./components/CreateIngresoModal";
import CreateSalidaModal from "./components/CreateSalidaModal";
import InventoryProductRow from "./components/InventoryProductRow";
import WarehouseReportModal from "./components/WarehouseReportModal";

/**
 * Inventory / Warehouse Control View
 * Handles warehouse inputs, outputs, stock counts, and Kardex audit trails
 */
function InventoryView({
  products = [],
  kardex = [],
  warehouseMovements = [],
  onAcceptWarehouseMovement,
  onCreateSalida,
  onCreateIngreso,
  orders = [],
  productionOrders = [],
  onNewProduction,
  onAddStock
}) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIngresoModalOpen, setIsIngresoModalOpen] = useState(false);
  const [isSalidaModalOpen, setIsSalidaModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Warehouse movements filter and count logic
  const {
    movementFilter,
    setMovementFilter,
    pendingMovementsCount,
    filteredMovements
  } = useWarehouseMovementsFilter(warehouseMovements);

  // Income draft items hook
  const {
    incomeItems,
    tempProductId,
    setTempProductId,
    tempQuantity,
    setTempQuantity,
    addItem,
    removeItem,
    initDraft,
    clearDraft
  } = useIncomeDraft();

  const handleIncomeSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const reason = formData.get("reason");
    const docRef = formData.get("docRef");
    const location = formData.get("location");

    if (incomeItems.length === 0) {
      alert("Debe agregar al menos un producto.");
      return;
    }

    incomeItems.forEach((item) => {
      onAddStock?.(item.productId, item.quantity, reason, docRef, location);
    });

    setIsModalOpen(false);
    clearDraft();
  };

  const openAddStock = (productId) => {
    initDraft(productId, 10);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-col sm:items-start justify-between gap-4 border-b border-shop-line pb-4 xl:flex-row xl:items-center">
        <div className="space-y-1">
          <h1 className="text-shop-ink tracking-tight font-medium text-[28px]">Control de Almacén</h1>
          <p className="text-xs font-medium text-shop-muted font-shop">
            Gestión de existencias producidas, salidas de pedidos/OPs y movimientos de inventario terminado.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsReportModalOpen(true)}
          className="px-4 py-2.5 bg-shop-ink hover:bg-shop-ink text-white rounded-[2px] text-xs font-semibold transition-all flex items-center gap-2 tabular-nums shrink-0 min-h-9"
        >
          <FileSpreadsheet className="w-4 h-4 text-blue-400" />
          <span>Generar Reporte de Almacén</span>
        </button>
      </div>

      {/* Warehouse Movements Section (Inputs and Outputs) */}
      <WarehouseMovementsSection
        movements={filteredMovements}
        filter={movementFilter}
        onFilterChange={setMovementFilter}
        pendingCount={pendingMovementsCount}
        onAcceptMovement={onAcceptWarehouseMovement}
        onOpenCreateIngreso={() => setIsIngresoModalOpen(true)}
        onOpenCreateSalida={() => setIsSalidaModalOpen(true)}
        onOpenIncomeStock={() => setIsIngresoModalOpen(true)}
        onOpenReport={() => setIsReportModalOpen(true)}
      />

      {/* Warehouse Movements Report Modal */}
      <AnimatePresence>
        {isReportModalOpen && (
          <WarehouseReportModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            warehouseMovements={warehouseMovements}
            kardex={kardex}
            products={products}
            orders={orders}
            productionOrders={productionOrders}
          />
        )}
      </AnimatePresence>

      {/* Create Ingreso Modal (Con OP / Manual) */}
      <AnimatePresence>
        {isIngresoModalOpen && (
          <CreateIngresoModal
            isOpen={isIngresoModalOpen}
            onClose={() => setIsIngresoModalOpen(false)}
            productionOrders={productionOrders}
            orders={orders}
            products={products}
            warehouseMovements={warehouseMovements}
            onCreateIngreso={onCreateIngreso}
          />
        )}
      </AnimatePresence>

      {/* Income Stock Modal (Legacy/Direct) */}
      <AnimatePresence>
        {isModalOpen && (
          <IncomeStockModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              clearDraft();
            }}
            products={products}
            incomeItems={incomeItems}
            tempProductId={tempProductId}
            setTempProductId={setTempProductId}
            tempQuantity={tempQuantity}
            setTempQuantity={setTempQuantity}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            onSubmit={handleIncomeSubmit}
          />
        )}
      </AnimatePresence>

      {/* Create Salida Modal */}
      <AnimatePresence>
        {isSalidaModalOpen && (
          <CreateSalidaModal
            isOpen={isSalidaModalOpen}
            onClose={() => setIsSalidaModalOpen(false)}
            orders={orders}
            productionOrders={productionOrders}
            products={products}
            warehouseMovements={warehouseMovements}
            onCreateSalida={onCreateSalida}
          />
        )}
      </AnimatePresence>

      {/* Products Stock Inventory List */}
      <div className="grid grid-cols-1 gap-4">
        {products.map((p, idx) => (
          <InventoryProductRow
            key={p._id || p.id || `p-${idx}`}
            product={p}
            isSelected={selectedProduct?.id === p.id}
            onToggleSelect={() =>
              setSelectedProduct(selectedProduct?.id === p.id ? null : p)
            }
            onOpenAddStock={openAddStock}
            onNewProduction={onNewProduction}
            kardex={kardex}
          />
        ))}
      </div>
    </div>
  );
}

export default InventoryView;

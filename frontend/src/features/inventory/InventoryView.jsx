import React, { useId, useState } from "react";
import { AnimatePresence } from "motion/react";
import { CheckCircle2, FileSpreadsheet, Package, Truck, X } from "lucide-react";
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
  activeSection,
  onSectionChange,
  onAcceptWarehouseMovement,
  onCreateSalida,
  onCreateIngreso,
  orders = [],
  productionOrders = [],
  onNewProduction,
  onAddStock
}) {
  const sectionId = useId();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIngresoModalOpen, setIsIngresoModalOpen] = useState(false);
  const [isSalidaModalOpen, setIsSalidaModalOpen] = useState(false);
  const [salidaConfirmation, setSalidaConfirmation] = useState(null);
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

  const handleCreateSalida = async (payload) => {
    const result = await onCreateSalida(payload);
    if (result?.success) setSalidaConfirmation(result.movement ?? {});
    return result;
  };

  const handleTabKey = (event) => {
    const { key } = event;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(key)) return;
    event.preventDefault();
    const nextSection = key === "Home" ? "stock" : key === "End" ? "movements"
      : activeSection === "stock" ? "movements" : "stock";
    onSectionChange(nextSection);
    event.currentTarget.querySelector(`[data-section="${nextSection}"]`)?.focus();
  };

  return (
    <div className="space-y-6">
      <div className="fixed inset-x-4 top-4 z-[150] sm:left-auto sm:right-6 sm:top-6">
        <div className={salidaConfirmation ? "flex items-start gap-3 rounded-[2px] border border-emerald-200 bg-white px-4 py-3 shadow-md" : ""}>
          <div role="status">
            {salidaConfirmation && (
              <div className="flex items-start gap-2.5">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                <div className="text-xs">
                  <p className="font-semibold text-shop-ink">
                    {salidaConfirmation.guideNumber
                      ? `Guía ${salidaConfirmation.guideNumber} creada`
                      : "Salida registrada"}
                  </p>
                  {salidaConfirmation.status === "Pendiente" && (
                    <p className="mt-1 text-shop-muted">La salida quedó pendiente de aprobación.</p>
                  )}
                </div>
              </div>
            )}
          </div>
          {salidaConfirmation && (
            <button
              type="button"
              aria-label="Cerrar confirmación"
              onClick={() => setSalidaConfirmation(null)}
              className="ml-auto rounded-[2px] p-1 text-shop-muted hover:bg-shop-light hover:text-shop-ink focus-visible:outline-2 focus-visible:outline-shop-blue"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* View Header */}
      <div className="flex flex-col sm:flex-col sm:items-start justify-between gap-4 border-b border-shop-line pb-4 xl:flex-row xl:items-center">
        <div className="space-y-1">
          <h1 className="text-shop-ink tracking-tight flex items-center gap-2 font-medium text-[28px]">
            <Package aria-hidden="true" className="size-6 shrink-0 text-shop-blue" />
            Control de Almacén
          </h1>
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
          <span>Generar Reporte</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-shop-line pb-3">
        <div role="tablist" aria-label="Vistas de Almacén" onKeyDown={handleTabKey} className="flex flex-wrap gap-1 rounded-[2px] border border-shop-line bg-white p-1">
          {[["stock", "Inventario"], ["movements", "Movimientos"]].map(([section, label]) => {
            const isActive = activeSection === section;
            return (
              <button
                key={section}
                type="button"
                role="tab"
                id={`${sectionId}-tab-${section}`}
                data-section={section}
                aria-selected={isActive}
                aria-controls={`${sectionId}-panel-${section}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onSectionChange(section)}
                className={`flex min-h-9 items-center gap-2 rounded-[2px] px-3 py-1.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-shop-blue ${isActive ? "bg-shop-ink text-white" : "text-shop-muted hover:bg-shop-light"}`}
              >
                {label}
                {section === "movements" && pendingMovementsCount > 0 && (
                  <span className="rounded-sm bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-900 tabular-nums">
                    {pendingMovementsCount} <span className="sr-only">{pendingMovementsCount === 1 ? "pendiente" : "pendientes"}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsIngresoModalOpen(true)}
            className="flex min-h-9 items-center gap-1.5 rounded-[2px] bg-shop-ink px-3.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-700 active:bg-emerald-800 focus-visible:outline-emerald-700"
          >
            <Package aria-hidden="true" className="size-3.5" /> Generar Ingreso (OP / Manual)
          </button>
          <button
            type="button"
            onClick={() => {
              setSalidaConfirmation(null);
              setIsSalidaModalOpen(true);
            }}
            className="flex min-h-9 items-center gap-1.5 rounded-[2px] bg-shop-ink px-3.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-orange-700 active:bg-orange-800 focus-visible:outline-orange-700"
          >
            <Truck aria-hidden="true" className="size-3.5" /> Generar Salida (OP / Pedido)
          </button>
        </div>
      </div>

      <section
        id={`${sectionId}-panel-movements`}
        role="tabpanel"
        aria-labelledby={`${sectionId}-tab-movements`}
        hidden={activeSection !== "movements"}
      >
        <WarehouseMovementsSection
          movements={filteredMovements}
          filter={movementFilter}
          onFilterChange={setMovementFilter}
          onAcceptMovement={onAcceptWarehouseMovement}
        />
      </section>

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
            onCreateSalida={handleCreateSalida}
          />
        )}
      </AnimatePresence>

      <section
        id={`${sectionId}-panel-stock`}
        role="tabpanel"
        aria-labelledby={`${sectionId}-tab-stock`}
        hidden={activeSection !== "stock"}
      >
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
      </section>
    </div>
  );
}

export default InventoryView;

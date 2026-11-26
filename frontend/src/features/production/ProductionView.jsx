import React, { useEffect, useState } from "react";
import { Plus, Filter, Scissors, Package } from "lucide-react";
import { Pagination } from "@/components/shop/ShopUI";
import useProduction from "./hooks/useProduction";
import { useProductionFilters } from "./hooks/useProductionFilters";
import ProductionFilterToolbar from "./components/ProductionFilterToolbar";
import NewOPForm from "./components/NewOPForm";
import ProductionOrderCard from "./components/ProductionOrderCard";

/**
 * Production Module View
 * Handles workshop order tracking, progressive stage transitions, and manual production lot creation
 */
function ProductionView({
  productionOrders: propOrders,
  setProductionOrders: propSetOrders,
  updateStage: propUpdateStage,
  createProductionOrder: propCreateOrder,
  products = [],
  salesOrders = [],
  warehouseMovements = [],
  onOpenGenerateIngreso,
  suppliers = []
}) {
  const hookProduction = useProduction(!propOrders);

  const productionOrders = propOrders || hookProduction.productionOrders;
  const setProductionOrders = propSetOrders || hookProduction.setProductionOrders;
  const updateStage = propUpdateStage || hookProduction.updateStage;
  const createProductionOrder = propCreateOrder || hookProduction.createProductionOrder;

  // Modals & Selectors State
  const [showNewOPModal, setShowNewOPModal] = useState(false);
  const [selectedOP, setSelectedOP] = useState(null);
  const [showProductSelector, setShowProductSelector] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filters hook
  const {
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
    stagesList
  } = useProductionFilters({
    productionOrders,
    salesOrders
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStage, selectedType, startDate, endDate, sortBy]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredOPs.length / pageSize));
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [filteredOPs.length, pageSize, currentPage]);

  const pagedOPs = filteredOPs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleUpdateExtras = (opId, productId, extras) => {
    setProductionOrders((prev) =>
      prev.map((op) => {
        if (op.id === opId) {
          return {
            ...op,
            items: op.items.map((item) =>
              item.productId === productId
                ? { ...item, quantityExtras: Math.max(0, extras) }
                : item
            )
          };
        }
        return op;
      })
    );
  };

  const handleAddExtraProduct = (opId, product) => {
    setProductionOrders((prev) =>
      prev.map((op) => {
        if (op.id === opId) {
          const exists = op.items.some((i) => i.productId === product.id);
          if (exists) return op;
          return {
            ...op,
            items: [
              ...op.items,
              {
                productId: product.id,
                productName: product.name,
                quantityOrdered: 0,
                quantityExtras: 10
              }
            ]
          };
        }
        return op;
      })
    );
    setShowProductSelector(null);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-col sm:items-start justify-between gap-4 border-b border-shop-line pb-4 xl:flex-row xl:items-center">
        <div className="space-y-1">
          <h1 className="text-shop-ink tracking-tight flex items-center gap-2 font-medium text-[28px]">
            <Scissors className="w-6 h-6 text-shop-blue" /> Control de Producción en Taller
          </h1>
          <p className="text-xs font-medium text-shop-muted font-shop">
            Seguimiento de etapas: tendido, corte, costura, limpieza, planchado y empaquetado
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-[2px] text-xs font-medium transition-all border ${
              showAdvancedFilters || hasActiveFilters
                ? "bg-shop-light border-shop-line text-shop-blue"
                : "bg-white border-shop-line text-shop-muted hover:bg-shop-light"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-shop-ink" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowNewOPModal((prev) => !prev)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-shop-ink text-white rounded-[2px] text-xs font-semibold hover:bg-shop-ink transition-all min-h-9"
          >
            <Plus className="w-4 h-4" /> Nueva OP Manual
          </button>
        </div>
      </div>

      {/* Manual New OP Modal / Drawer Form */}
      {showNewOPModal && (
        <NewOPForm
          products={products}
          createProductionOrder={createProductionOrder}
          setProductionOrders={setProductionOrders}
          onClose={() => setShowNewOPModal(false)}
        />
      )}

      {/* Filter and search toolbar */}
      <ProductionFilterToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedStage={selectedStage}
        setSelectedStage={setSelectedStage}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        sortBy={sortBy}
        setSortBy={setSortBy}
        showAdvancedFilters={showAdvancedFilters}
        stagesList={stagesList}
        stageCounts={stageCounts}
        filteredCount={filteredOPs.length}
        totalCount={productionOrders.length}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
      />

      {/* Production Orders list */}
      {filteredOPs.length === 0 ? (
        <div className="bg-white border border-shop-line rounded-[2px] p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Package className="w-10 h-10 text-slate-300 stroke-1" />
          <h3 className="text-sm font-semibold text-shop-muted">
            No se encontraron Órdenes de Producción
          </h3>
          <p className="text-xs text-shop-muted max-w-sm">
            {hasActiveFilters
              ? "Prueba a cambiar tus criterios de búsqueda o limpia los filtros activos."
              : "No hay órdenes de confección activas en este momento. Crea una nueva OP con el botón superior."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-2 text-xs font-medium text-shop-blue hover:underline tabular-nums"
            >
              Restablecer Filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {pagedOPs.map((op) => (
            <ProductionOrderCard
              key={op.id}
              op={op}
              products={products}
              salesOrders={salesOrders}
              warehouseMovements={warehouseMovements}
              onOpenGenerateIngreso={onOpenGenerateIngreso}
              isSelected={selectedOP === op.id}
              onToggleSelect={() => setSelectedOP(selectedOP === op.id ? null : op.id)}
              showProductSelector={showProductSelector === op.id}
              setShowProductSelector={(val) => setShowProductSelector(val)}
              onAddExtraProduct={handleAddExtraProduct}
              onUpdateExtras={handleUpdateExtras}
              onUpdateStage={updateStage}
              suppliers={suppliers}
            />
          ))}
        </div>
      )}
      {filteredOPs.length > 0 && (
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredOPs.length}
          itemLabel="órdenes de producción"
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
}

export default ProductionView;

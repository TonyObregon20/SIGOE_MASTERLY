import React, { useState } from "react";
import { Plus, Filter, Scissors, Package } from "lucide-react";
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
  suppliers = [],
  loadSuppliers,
  onAddSupplierRecord
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Scissors className="w-6 h-6 text-blue-600" /> Control de Producción en Taller
          </h2>
          <p className="text-xs font-medium text-slate-500 italic font-serif">
            Seguimiento de etapas: tendido, corte, costura, limpieza, planchado y empaquetado
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              showAdvancedFilters || hasActiveFilters
                ? "bg-blue-50 border-blue-200 text-blue-700 shadow-xs"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowNewOPModal((prev) => !prev)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
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
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-xs">
          <Package className="w-10 h-10 text-slate-300 stroke-1" />
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">
            No se encontraron Órdenes de Producción
          </h3>
          <p className="text-xs text-slate-400 max-w-sm italic">
            {hasActiveFilters
              ? "Prueba a cambiar tus criterios de búsqueda o limpia los filtros activos."
              : "No hay órdenes de confección activas en este momento. Crea una nueva OP con el botón superior."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-2 text-xs font-bold text-blue-600 hover:underline uppercase font-mono tracking-wider"
            >
              Restablecer Filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredOPs.map((op) => (
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
    </div>
  );
}

export default ProductionView;

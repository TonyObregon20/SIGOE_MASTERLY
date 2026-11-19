import React from "react";
import { Package, Plus, Trash2, ChevronRight } from "lucide-react";
import { useNewOPDraft } from "../hooks/useNewOPDraft";

/**
 * Form panel to register a new Production Order with single-size or multi-size distribution
 */
export default function NewOPForm({
  products = [],
  createProductionOrder,
  setProductionOrders,
  onClose
}) {
  const {
    selectedProductId,
    setSelectedProductId,
    sizingMode,
    setSizingMode,
    singleSize,
    setSingleSize,
    singleQty,
    setSingleQty,
    distribution,
    setDistribution,
    customOrderId,
    setCustomOrderId,
    opResponsible,
    setOpResponsible,
    draftItems,
    totalLotUnits,
    handleAddDraftItem,
    handleRemoveDraftItem,
    handleSaveOP
  } = useNewOPDraft({
    products,
    createProductionOrder,
    setProductionOrders,
    onCompleted: onClose
  });

  return (
    <div className="bg-white border border-shop-line rounded-[2px] p-6 space-y-6 fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between border-b border-shop-line pb-3">
        <div className="space-y-1">
          <h3 className="text-lg font-medium text-shop-ink">Nueva Orden de Producción</h3>
          <p className="text-xs text-shop-muted font-shop">
            Ingresa modelos y cantidades para derivar al taller de confección
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-shop-muted hover:text-shop-muted text-xs font-medium tabular-nums"
        >
          Cancelar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Col Left: add item to OP */}
        <div className="lg:col-span-7 bg-shop-light/50 p-5 rounded-[2px] border border-slate-250 space-y-5">
          <h4 className="text-xs font-semibold text-shop-muted border-b border-shop-line pb-2">
            1. Agregar Modelo a Fabricar
          </h4>

          {/* Product Picker */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-shop-muted">
              Seleccionar Producto
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-shop-line rounded-[2px] font-semibold focus:ring-2 focus:ring-shop-blue/20 outline-none min-h-10 min-w-0 text-base sm:text-[13px]"
            >
              {products.map((p, idx) => (
                <option key={p._id || p.id || `opt-p-${idx}`} value={p.id}>
                  {p.name} - S/ {p.price} (Stock: {p.stockPhysical} uds)
                </option>
              ))}
            </select>
          </div>

          {/* Input Mode Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-shop-muted">
              Modo de Ingreso de Cantidades
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSizingMode("distribution")}
                className={`py-2 px-3 rounded-[2px] border text-xs font-medium transition-all ${
                  sizingMode === "distribution"
                    ? "bg-shop-ink border-slate-900 text-white"
                    : "bg-white border-shop-line text-shop-muted hover:bg-shop-light"
                }`}
              >
                Distribución por Tallas
              </button>
              <button
                type="button"
                onClick={() => setSizingMode("single")}
                className={`py-2 px-3 rounded-[2px] border text-xs font-medium transition-all ${
                  sizingMode === "single"
                    ? "bg-shop-ink border-slate-900 text-white"
                    : "bg-white border-shop-line text-shop-muted hover:bg-shop-light"
                }`}
              >
                Talla Única / General
              </button>
            </div>
          </div>

          {/* Mode Single Size */}
          {sizingMode === "single" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-shop-muted">
                  Elegir Talla
                </label>
                <select
                  value={singleSize}
                  onChange={(e) => setSingleSize(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-shop-line rounded-[2px] font-semibold focus:ring-2 focus:ring-shop-blue/20 outline-none min-h-10 min-w-0 text-base sm:text-[13px]"
                >
                  <option value="Única">Única / General</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-shop-muted">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  value={singleQty}
                  onChange={(e) => setSingleQty(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-white border border-shop-line rounded-[2px] font-medium focus:ring-2 focus:ring-shop-blue/20 outline-none tabular-nums min-h-10 min-w-0 text-base sm:text-[13px]"
                />
              </div>
            </div>
          )}

          {/* Mode Distribution */}
          {sizingMode === "distribution" && (
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-shop-muted block">
                Indique cantidad por cada talla
              </label>
              <div className="grid grid-cols-4 gap-2 bg-white p-4 rounded-[2px] border border-shop-line">
                {["S", "M", "L", "XL"].map((sz) => (
                  <div key={sz} className="text-center space-y-1">
                    <span className="text-[11px] font-semibold text-shop-muted tabular-nums block">
                      {sz}
                    </span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={distribution[sz] || ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setDistribution((prev) => ({ ...prev, [sz]: Math.max(0, val) }));
                      }}
                      className="w-full text-center px-2 py-1 bg-shop-light border border-shop-line rounded-[2px] font-medium outline-none focus:bg-white focus:ring-2 focus:ring-shop-blue/20 tabular-nums min-h-10 min-w-0 text-base sm:text-[13px]"
                    />
                  </div>
                ))}
              </div>
              <div className="text-right text-[11px] font-medium text-shop-muted">
                Suma Total:{" "}
                <span className="font-semibold text-shop-blue tabular-nums text-xs">
                  {Object.values(distribution).reduce((a, b) => a + (b || 0), 0)} uds
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleAddDraftItem}
            className="w-full py-2 bg-shop-ink text-white rounded-[2px] text-xs font-medium hover:bg-shop-ink transition-all flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Añadir a la Lista
          </button>
        </div>

        {/* Col Right: Summary list of active OP items */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-4 flex-1">
            <h4 className="text-xs font-semibold text-shop-muted border-b border-shop-line pb-2">
              2. Resumen del Lote
            </h4>

            {draftItems.length === 0 ? (
              <div className="h-40 border border-dashed border-shop-line rounded-[2px] flex flex-col items-center justify-center text-shop-muted p-4 text-center">
                <Package className="w-8 h-8 stroke-1 text-slate-300 mb-2" />
                <p className="text-xs font-medium">No hay modelos en la OP aún</p>
                <p className="text-[11px] text-shop-muted mt-1 max-w-[200px]">
                  Usa el panel izquierdo para agregar los productos que quieres confeccionar en esta OP
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {draftItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-shop-line rounded-[2px] p-3 flex justify-between items-center relative group"
                  >
                    <div className="space-y-0.5 max-w-[80%]">
                      <p className="text-xs font-medium text-shop-ink truncate">{item.product.name}</p>
                      {item.selectedSize ? (
                        <p className="text-[11px] font-semibold text-shop-muted tabular-nums">
                          Talla: {item.selectedSize}
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {Object.entries(item.sizeDistribution || {}).map(
                            ([sz, q]) =>
                              q > 0 && (
                                <span
                                  key={sz}
                                  className="text-[11px] font-medium bg-shop-light border border-shop-line px-1 py-0.2 rounded-[2px] text-shop-muted"
                                >
                                  {sz}: {q}
                                </span>
                              )
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[11px] font-medium text-shop-muted block">
                          CANT
                        </span>
                        <span className="text-xs font-semibold text-shop-ink tabular-nums bg-shop-light px-1.5 py-0.5 border border-shop-line rounded-[2px]">
                          {item.quantity}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDraftItem(idx)}
                        className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                        title="Eliminar de la lista"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Global info & Submit */}
          <div className="bg-shop-light p-4 rounded-[2px] border border-shop-line space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-shop-muted">
                  Referencia OP / OrderId (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Autogenerado"
                  value={customOrderId}
                  onChange={(e) => setCustomOrderId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-shop-line rounded-[2px] font-medium outline-none focus:ring-2 focus:ring-shop-blue/20 tabular-nums min-h-10 min-w-0 text-base sm:text-[13px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-shop-muted">
                  Responsable Tendido
                </label>
                <input
                  type="text"
                  placeholder="Operario de Tendido"
                  value={opResponsible}
                  onChange={(e) => setOpResponsible(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-shop-line rounded-[2px] font-semibold outline-none focus:ring-2 focus:ring-shop-blue/20 min-h-10 min-w-0 text-base sm:text-[13px]"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-shop-line flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-shop-muted">Total Lote</p>
                <p className="text-lg font-semibold text-shop-blue tabular-nums leading-none">
                  {totalLotUnits} uds
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveOP}
                disabled={draftItems.length === 0}
                className={`px-5 py-2.5 rounded-[2px] text-xs font-medium flex items-center gap-1 transition-all ${
                  draftItems.length === 0
                    ? "bg-slate-250 text-shop-muted cursor-not-allowed"
                    : "bg-shop-ink text-white hover:bg-shop-ink cursor-pointer tabular-nums"
                }`}
              >
                Registrar Lote completo <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

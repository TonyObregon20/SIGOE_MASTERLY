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
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md shadow-slate-100 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-800">Nueva Orden de Producción</h3>
          <p className="text-xs text-slate-500 font-sans italic">
            Ingresa modelos y cantidades para derivar al taller de confección
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 text-xs font-medium uppercase font-mono tracking-wider"
        >
          Cancelar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Col Left: add item to OP */}
        <div className="lg:col-span-7 bg-slate-50/50 p-5 rounded-2xl border border-slate-250 space-y-5">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-600 border-b border-slate-200 pb-2">
            1. Agregar Modelo a Fabricar
          </h4>

          {/* Product Picker */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Seleccionar Producto
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 outline-none"
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
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Modo de Ingreso de Cantidades
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSizingMode("distribution")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  sizingMode === "distribution"
                    ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Distribución por Tallas
              </button>
              <button
                type="button"
                onClick={() => setSizingMode("single")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  sizingMode === "single"
                    ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
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
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Elegir Talla
                </label>
                <select
                  value={singleSize}
                  onChange={(e) => setSingleSize(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 outline-none"
                >
                  <option value="Única">Única / General</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  value={singleQty}
                  onChange={(e) => setSingleQty(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none font-mono"
                />
              </div>
            </div>
          )}

          {/* Mode Distribution */}
          {sizingMode === "distribution" && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-450 block">
                Indique cantidad por cada talla
              </label>
              <div className="grid grid-cols-4 gap-2 bg-white p-4 rounded-xl border border-slate-200">
                {["S", "M", "L", "XL"].map((sz) => (
                  <div key={sz} className="text-center space-y-1">
                    <span className="text-[10px] font-black text-slate-400 font-mono block uppercase">
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
                      className="w-full text-center px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-mono"
                    />
                  </div>
                ))}
              </div>
              <div className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Suma Total:{" "}
                <span className="font-black text-blue-600 font-mono text-xs">
                  {Object.values(distribution).reduce((a, b) => a + (b || 0), 0)} uds
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleAddDraftItem}
            className="w-full py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-1 shadow-sm uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" /> Añadir a la Lista
          </button>
        </div>

        {/* Col Right: Summary list of active OP items */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-4 flex-1">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-600 border-b border-slate-200 pb-2">
              2. Resumen del Lote
            </h4>

            {draftItems.length === 0 ? (
              <div className="h-40 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <Package className="w-8 h-8 stroke-1 text-slate-300 mb-2" />
                <p className="text-xs font-bold">No hay modelos en la OP aún</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                  Usa el panel izquierdo para agregar los productos que quieres confeccionar en esta OP
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {draftItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 rounded-xl p-3 flex justify-between items-center shadow-sm relative group"
                  >
                    <div className="space-y-0.5 max-w-[80%]">
                      <p className="text-xs font-bold text-slate-800 truncate">{item.product.name}</p>
                      {item.selectedSize ? (
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                          Talla: {item.selectedSize}
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {Object.entries(item.sizeDistribution || {}).map(
                            ([sz, q]) =>
                              q > 0 && (
                                <span
                                  key={sz}
                                  className="text-[8px] font-bold bg-slate-50 border border-slate-200 px-1 py-0.2 rounded text-slate-500"
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
                        <span className="text-[9px] font-medium text-slate-400 block tracking-wider">
                          CANT
                        </span>
                        <span className="text-xs font-black text-slate-800 font-mono bg-slate-50 px-1.5 py-0.5 border border-slate-150 rounded">
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
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Referencia OP / OrderId (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Autogenerado"
                  value={customOrderId}
                  onChange={(e) => setCustomOrderId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Responsable Tendido
                </label>
                <input
                  type="text"
                  placeholder="Operario de Tendido"
                  value={opResponsible}
                  onChange={(e) => setOpResponsible(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Lote</p>
                <p className="text-lg font-black text-blue-700 font-mono leading-none">
                  {totalLotUnits} uds
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveOP}
                disabled={draftItems.length === 0}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                  draftItems.length === 0
                    ? "bg-slate-250 text-slate-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/10 active:scale-95 cursor-pointer uppercase tracking-wider font-mono"
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

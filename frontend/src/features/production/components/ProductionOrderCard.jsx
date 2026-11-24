import AdminDialog from "@/components/admin/AdminDialog";
import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Clock,
  Package,
  FileText,
  Plus,
  SlidersHorizontal,
  X,
  Layers,
  CheckCircle2
} from "lucide-react";
import { getStatusColor } from "../productionUtils";
import { formatProductionOrderId } from "../productionUtils";
import StageManager from "./StageManager";

export default function ProductionOrderCard({
  op,
  products = [],
  salesOrders = [],
  warehouseMovements = [],
  onOpenGenerateIngreso,
  isSelected = false,
  onToggleSelect,
  showProductSelector,
  setShowProductSelector,
  onAddExtraProduct,
  onUpdateExtras,
  onUpdateStage,
  suppliers = []
}) {
  const [showStageManager, setShowStageManager] = useState(false);
  const firstItem = op.items?.[0];
  const product = products.find((p) => p.id === firstItem?.productId);
  const salesOrder = op.orderId ? salesOrders.find((o) => o.id === op.orderId) : null;
  const isFinished = op.currentStage === "Finalizado" || (op.progress || 0) >= 100;
  const existingIngreso = (warehouseMovements || []).find(
    (wm) => wm.opId === op.id && wm.type === "Ingreso"
  );

  const closeModal = () => {
    setShowStageManager(false);
    onToggleSelect();
  };

  return (
    <>
      <div className="flex flex-col gap-4 border border-shop-line bg-white px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden border border-shop-line bg-shop-light">
            {product?.image ? (
              <img src={product.image} alt={product.name || "Prenda"} className="size-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Package className="size-5 text-shop-muted" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-shop-ink" title={op.id}>
              Fabricación Lote {formatProductionOrderId(op.id)}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-shop-muted">
              {op.orderId && !op.orderId.includes("AUTO") ? (
                <span className="flex items-center gap-1 text-shop-blue">
                  <FileText className="size-3" /> {salesOrder?.customerName || op.orderId}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-700">
                  <Package className="size-3" /> AUTOSTOCK
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="size-3" /> {op.startDate || "-"}
              </span>
              <span>{op.items?.length || 0} modelos</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 md:justify-end">
          <div className="text-right">
            <span className="block text-[11px] text-shop-muted">{op.currentStage}</span>
            <span className="text-lg font-semibold text-shop-ink tabular-nums">{Math.round(op.progress || 0)}%</span>
          </div>
          <button
            type="button"
            onClick={onToggleSelect}
            className="min-h-10 border border-shop-ink bg-shop-ink px-4 py-2 text-xs font-medium text-white hover:bg-shop-blue"
          >
            Visualizar
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isSelected && (
          <AdminDialog label="Visualizar orden de producción" onClose={closeModal} className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-shop-ink/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 16 }}
              className="relative z-10 flex max-h-[92dvh] w-full max-w-7xl flex-col overflow-hidden border border-shop-line bg-white"
            >
              <header className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-shop-ink px-5 py-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center border border-blue-400/30 bg-shop-ink/20 text-blue-400">
                    <Layers className="size-5" />
                  </div>
                  <div>
                    <h3 className="truncate text-sm font-medium tabular-nums" title={op.id}>Orden de producción {formatProductionOrderId(op.id)}</h3>
                    <p className="mt-0.5 text-[11px] text-slate-300">
                      {op.orderId && !op.orderId.includes("AUTO") ? salesOrder?.customerName || op.orderId : "Producción por stock"}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={closeModal} className="flex size-9 items-center justify-center text-slate-300 hover:text-white" aria-label="Cerrar">
                  <X className="size-5" />
                </button>
              </header>

              <div className="overflow-y-auto p-4 sm:p-6">
                <div className="mb-6 rounded-[2px] border border-shop-line p-5">
                  <div className="mb-8 flex items-start justify-between gap-4">
                    <div>
                      <p className="truncate text-lg font-medium text-shop-ink" title={op.id}>Fabricación Lote {formatProductionOrderId(op.id)}</p>
                      <p className="mt-1 text-xs text-shop-muted">{op.startDate || "-"} · {op.items?.length || 0} modelos</p>
                    </div>
                    <div className="text-right">
                      <span className="block text-[11px] font-medium text-shop-blue">{op.currentStage}</span>
                      <span className="text-2xl font-semibold text-shop-ink tabular-nums">{Math.round(op.progress || 0)}%</span>
                    </div>
                  </div>

                  <div className="relative mb-2 h-1 rounded-full bg-shop-light">
                    <div className="absolute h-full rounded-full bg-shop-ink" style={{ width: `${op.progress || 0}%` }} />
                    <div className="absolute -top-1.5 inset-x-0 flex justify-between">
                      {op.stages?.map((stage) => (
                        <div key={stage.name} className="flex flex-col items-center">
                          <div className={`size-4 rounded-full border-4 border-white ${getStatusColor(stage.status)}`} />
                          <span className="mt-2 text-[11px] text-shop-muted">{stage.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-shop-line pb-2">
                    <p className="text-xs font-semibold text-shop-muted">Contenido de la producción</p>
                    <button
                      type="button"
                      onClick={() => setShowProductSelector(showProductSelector ? null : op.id)}
                      className="flex items-center gap-1 text-xs font-semibold text-shop-blue"
                    >
                      <Plus className="size-3" /> Añadir modelo extra
                    </button>
                  </div>

                  {showProductSelector && (
                    <div className="grid grid-cols-2 gap-2 border border-shop-line bg-shop-light p-3 md:grid-cols-4">
                      {products.map((item) => (
                        <button
                          type="button"
                          key={item._id || item.id}
                          onClick={() => onAddExtraProduct(op.id, item)}
                          className="border border-shop-line bg-white p-2 text-left text-xs text-shop-ink hover:border-shop-blue"
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {op.items?.map((item, index) => (
                    <div key={`${item.productId}-${index}`} className="flex flex-col gap-4 border border-shop-line bg-shop-light p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-shop-ink">{item.productName}</p>
                        <p className="mt-1 text-[11px] text-shop-muted">Pedido clientes: {item.quantityOrdered} uds</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-[11px] text-shop-muted">Extras almacén</label>
                        <input
                          type="number"
                          value={item.quantityExtras || 0}
                          onChange={(event) => onUpdateExtras(op.id, item.productId, Number(event.target.value))}
                          className="h-10 w-16 border border-shop-line bg-white px-2 text-sm tabular-nums"
                        />
                        <span className="text-right">
                          <span className="block text-[11px] text-emerald-600">Total producción</span>
                          <strong className="text-sm text-emerald-700 tabular-nums">{(item.quantityOrdered || 0) + (item.quantityExtras || 0)} uds</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {showStageManager ? (
                  <div className="mt-6 border-t border-shop-line">
                    <StageManager op={op} updateStage={onUpdateStage} suppliers={suppliers} isModal={true} />
                  </div>
                ) : (
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-shop-line pt-4">
                    {isFinished && !existingIngreso ? (
                      <button type="button" onClick={() => onOpenGenerateIngreso?.(op.id)} className="min-h-9 bg-shop-ink px-4 py-2 text-xs font-medium text-white">
                        <Package className="mr-1.5 inline size-3.5" /> Generar ingreso con OP
                      </button>
                    ) : isFinished && existingIngreso ? (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-700">
                        <CheckCircle2 className="size-4" /> Ingreso: {existingIngreso.status} ({existingIngreso.id})
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setShowStageManager(true)}
                      className="ml-auto min-h-9 bg-shop-ink px-5 py-2 text-xs font-medium text-white"
                    >
                      <SlidersHorizontal className="mr-1.5 inline size-3.5" /> Gestionar etapas
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </AdminDialog>
        )}
      </AnimatePresence>
    </>
  );
}

import AdminDialog from "@/components/admin/AdminDialog";
import React, { useState, useMemo, useRef } from "react";
import { motion } from "motion/react";
import {
  X,
  Truck,
  Layers,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Package,
  Plus,
  Trash2
} from "lucide-react";

import GuideModeModal from "@/features/warehouse/components/GuideModeModal";
import GuideEvidenceFields from "@/features/warehouse/components/GuideEvidenceFields";
import { validateGuideFields } from "@/features/warehouse/guideUtils";

export default function CreateSalidaModal({
  isOpen,
  onClose,
  orders = [],
  productionOrders = [],
  products = [],
  warehouseMovements = [],
  onCreateSalida,
  initialOrderId = ""
}) {
  const [sourceType, setSourceType] = useState("order"); // "order", "op", "manual"
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrderId);
  const [selectedOpId, setSelectedOpId] = useState("");
  const [manualItems, setManualItems] = useState([]);
  const [manualProductId, setManualProductId] = useState("");
  const [manualQuantity, setManualQuantity] = useState(1);
  const [manualSize, setManualSize] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [autoAccept, setAutoAccept] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guideMode, setGuideMode] = useState(null);
  const [guideNumber, setGuideNumber] = useState("");
  const [guidePhoto, setGuidePhoto] = useState("");
  const [photoReading, setPhotoReading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const sending = useRef(false);
  const requestId = useRef(crypto.randomUUID());
  const close = () => { if (!sending.current && !photoReading) onClose(); };

  // Detailed analysis of each order in relation to production & warehouse lifecycle
  const analyzedOrders = useMemo(() => {
    return orders.map((o) => {
      const associatedOp = productionOrders.find((op) => op.orderId === o.id);
      const isCustomOrder = o.type === "pedido" || Boolean(associatedOp);

      const totalOrderUnits = (o.items || []).reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

      // Ingress movements accepted in warehouse for this order or its OP
      const acceptedIngresos = warehouseMovements.filter(
        (wm) =>
          wm.type === "Ingreso" &&
          wm.status === "Aceptado" &&
          (wm.orderId === o.id || (associatedOp && wm.opId === associatedOp.id))
      );
      const totalIngressedUnits = acceptedIngresos.reduce((sum, wm) => {
        const itemSum = (wm.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
        return sum + (itemSum || Number(wm.quantity) || 0);
      }, 0);

      // Salida movements accepted in warehouse for this order
      const acceptedSalidas = warehouseMovements.filter(
        (wm) =>
          wm.type === "Salida" &&
          wm.status === "Aceptado" &&
          (wm.orderId === o.id || (associatedOp && wm.opId === associatedOp.id))
      );
      const totalDispatchedUnits = acceptedSalidas.reduce((sum, wm) => {
        const itemSum = (wm.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
        return sum + (itemSum || Number(wm.quantity) || 0);
      }, 0);

      const availableInWarehouse = isCustomOrder
        ? Math.max(0, totalIngressedUnits - totalDispatchedUnits)
        : totalOrderUnits;

      let opProgress = 0;
      let opStage = "";
      let isOpFinished = false;
      if (associatedOp) {
        opProgress = associatedOp.progress || 0;
        opStage = associatedOp.currentStage || "En proceso";
        isOpFinished = associatedOp.currentStage === "Finalizado" || associatedOp.progress === 100;
      }

      let canGenerateSalida = false;
      let statusCategory = "ready";
      let statusMessage = "";

      if (totalOrderUnits > 0 && totalDispatchedUnits >= totalOrderUnits) {
        statusCategory = "shipped";
        statusMessage = `Pedido 100% Despachado (${totalDispatchedUnits}/${totalOrderUnits} uds entregadas)`;
      } else if (availableInWarehouse > 0) {
        canGenerateSalida = true;
        statusCategory = "ready";
        if (totalDispatchedUnits > 0) {
          statusMessage = `Despacho parcial previo (${totalDispatchedUnits}/${totalOrderUnits} uds). Disponible en almacén: ${availableInWarehouse} uds para entregar.`;
        } else {
          statusMessage = `Disponible en almacén: ${availableInWarehouse} uds. Listo para autorizar salida y despacho.`;
        }
      } else if (isCustomOrder) {
        if (!associatedOp) {
          statusCategory = "in_production";
          statusMessage = "A Pedido - Aún no se ha iniciado la Orden de Producción (OP)";
        } else if (totalIngressedUnits === 0) {
          statusCategory = "in_production";
          statusMessage = `En Fabricación (${associatedOp.id} • ${opStage} ${opProgress}%). Aún no hay ingresos recibidos en almacén.`;
        } else {
          statusCategory = "waiting_production";
          statusMessage = `Lote anterior ya despachado (${totalDispatchedUnits}/${totalOrderUnits} uds). Esperando que el taller ingrese las siguientes prendas a almacén.`;
        }
      } else {
        canGenerateSalida = true;
        statusCategory = "ready";
        statusMessage = "Venta directa de stock disponible";
      }

      return {
        ...o,
        associatedOp,
        isCustomOrder,
        isOpFinished,
        totalOrderUnits,
        totalIngressedUnits,
        totalDispatchedUnits,
        availableInWarehouse,
        canGenerateSalida,
        statusCategory,
        statusMessage
      };
    });
  }, [orders, productionOrders, warehouseMovements]);

  // Eligible orders: Only orders physically in warehouse with accepted ingress and without accepted egress
  const eligibleOrders = useMemo(() => {
    return analyzedOrders.filter((o) => o.canGenerateSalida);
  }, [analyzedOrders]);

  // Orders currently in workshop / awaiting ingress acceptance
  const inProgressOrders = useMemo(() => {
    return analyzedOrders.filter(
      (o) => o.statusCategory === "in_production" || o.statusCategory === "ingreso_pending"
    );
  }, [analyzedOrders]);

  // Selected Order object
  const selectedOrder = useMemo(() => {
    return eligibleOrders.find((o) => o.id === selectedOrderId);
  }, [eligibleOrders, selectedOrderId]);

  // Analyzed OPs
  const analyzedOps = useMemo(() => {
    return productionOrders.map((op) => {
      const isFinished = op.currentStage === "Finalizado" || op.progress === 100;
      const ingresoMovement = warehouseMovements.find(
        (wm) => wm.opId === op.id && wm.type === "Ingreso"
      );
      const isIngresoAccepted = Boolean(ingresoMovement && ingresoMovement.status === "Aceptado");
      const isIngresoPending = Boolean(ingresoMovement && ingresoMovement.status === "Pendiente");

      const salidaMovement = warehouseMovements.find(
        (wm) => (wm.opId === op.id || (op.orderId && wm.orderId === op.orderId)) && wm.type === "Salida"
      );
      const isSalidaAccepted = Boolean(salidaMovement && salidaMovement.status === "Aceptado");
      const isSalidaPending = Boolean(salidaMovement && salidaMovement.status === "Pendiente");

      const linked = warehouseMovements.filter((wm) => wm.opId === op.id && wm.status === "Aceptado");
      const total = (type) => linked.filter((wm) => wm.type === type).reduce((sum, wm) => sum + (wm.items || []).reduce((n, i) => n + (Number(i.quantity) || 0), 0), 0);
      const canGenerateSalida = isFinished && isIngresoAccepted && !isSalidaPending && (op.orderId ? !isSalidaAccepted : total("Ingreso") > total("Salida"));

      return {
        ...op,
        isFinished,
        isIngresoAccepted,
        isIngresoPending,
        ingresoMovement,
        isSalidaAccepted,
        isSalidaPending,
        salidaMovement,
        canGenerateSalida
      };
    });
  }, [productionOrders, warehouseMovements]);

  // Eligible OPs: Only OPs that reached 100% and have their Ingreso accepted in warehouse
  const eligibleOps = useMemo(() => {
    return analyzedOps.filter((op) => op.canGenerateSalida);
  }, [analyzedOps]);

  // OPs still in fabrication or pending ingress
  const inProgressOps = useMemo(() => {
    return analyzedOps.filter((op) => !op.isFinished || (op.isFinished && !op.isIngresoAccepted));
  }, [analyzedOps]);

  // Selected OP object
  const selectedOp = useMemo(() => {
    return eligibleOps.find((op) => op.id === selectedOpId);
  }, [eligibleOps, selectedOpId]);

  // Check if selected order already has a salida movement
  const orderExistingSalida = useMemo(() => {
    if (!selectedOrderId) return null;
    return warehouseMovements.find(
      (wm) => wm.orderId === selectedOrderId && wm.type === "Salida"
    );
  }, [selectedOrderId, warehouseMovements]);

  // Check if selected OP already has a salida movement
  const opExistingSalida = useMemo(() => {
    if (!selectedOpId) return null;
    return warehouseMovements.find(
      (wm) => (wm.opId === selectedOpId || (selectedOp?.orderId && wm.orderId === selectedOp.orderId)) && wm.type === "Salida"
    );
  }, [selectedOpId, selectedOp, warehouseMovements]);

  // Stock check for selected Order
  const orderStockCheck = useMemo(() => {
    if (!selectedOrder || !selectedOrder.items) return { canFulfill: true, items: [] };
    const itemsCheck = selectedOrder.items.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const available = prod?.stockPhysical || 0;
      const required = item.quantity || 1;
      return {
        ...item,
        productName: prod?.name || item.productName || item.productId,
        available,
        required,
        isSufficient: available >= required
      };
    });
    const canFulfill = itemsCheck.every((i) => i.isSufficient);
    return { canFulfill, items: itemsCheck };
  }, [selectedOrder, products]);

  const handleAddManualItem = () => {
    if (!manualProductId) return;
    const prod = products.find((p) => p.id === manualProductId);
    if (!prod) return;
    setManualItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        quantity: Number(manualQuantity) || 1,
        selectedSize: manualSize || "Única"
      }
    ]);
    setManualProductId("");
    setManualQuantity(1);
    setManualSize("");
  };

  const handleRemoveManualItem = (idx) => {
    setManualItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending.current || photoReading) return;
    setSubmitError("");

    if (sourceType === "order") {
      if (!selectedOrderId) {
        alert("Por favor seleccione un pedido.");
        return;
      }
      if (orderExistingSalida && orderExistingSalida.status === "Aceptado") {
        alert("Este pedido ya cuenta con una salida de almacén aprobada.");
        return;
      }
    } else if (sourceType === "op") {
      if (!selectedOpId) {
        alert("Por favor seleccione una Orden de Producción.");
        return;
      }
    } else if (sourceType === "manual") {
      if (manualItems.length === 0) {
        alert("Debe agregar al menos un producto a la lista de salida.");
        return;
      }
    }

    try {
      if (guideMode === "CON_GUIA") validateGuideFields(guideNumber, guidePhoto);
    } catch (err) { setSubmitError(err.message); return; }
    sending.current = true;
    setIsSubmitting(true);
    try {
      const payload = {
        orderId: sourceType === "order" ? selectedOrderId : (sourceType === "op" && selectedOp?.orderId ? selectedOp.orderId : null),
        opId: sourceType === "op" ? selectedOpId : null,
        items: sourceType === "manual" ? manualItems : undefined,
        originType: sourceType === "order"
          ? (selectedOrder?.type === "pedido" ? "A Pedido" : "Venta Directa")
          : (sourceType === "op" ? "Producción OP" : "Ajuste / Merma"),
        reason: reason || (sourceType === "order" ? `Salida Almacén para Despacho Orden ${selectedOrderId}` : `Salida OP ${selectedOpId}`),
        notes: notes,
        autoAccept: autoAccept,
        requestId: requestId.current,
        guideMode,
        ...(guideMode === "CON_GUIA" ? { guideNumber, guidePhoto } : {})
      };

      const result = await onCreateSalida(payload);
      if (!result?.success) throw new Error(result?.message || "No se pudo registrar la salida.");
      onClose();
    } catch (err) {
      setSubmitError(err.message || "No se pudo registrar la salida.");
    } finally {
      sending.current = false;
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  if (!guideMode) return <GuideModeModal onSelect={setGuideMode} onClose={close} />;

  return (
    <AdminDialog label="Registrar salida" onClose={close} className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={close}
        className="absolute inset-0 bg-shop-ink/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-[2px] overflow-y-auto border border-shop-line max-h-[90dvh]"
      >
        <div className="p-7 space-y-6 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-shop-line pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[2px] bg-shop-light text-shop-blue flex items-center justify-center border border-blue-150">
                  <Truck className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-semibold text-shop-ink tracking-tight">
                  Generar Salida de Almacén
                </h3>
              </div>
              <p className="text-xs text-shop-muted font-shop">
                Verifica las prendas antes de habilitar el botón de Despacho en Ventas.
              </p>
            </div>
            <button aria-label="Cerrar ventana"
              type="button"
              onClick={close}
              className="p-2 bg-shop-light text-shop-muted rounded-[2px] hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Type Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-shop-light rounded-[2px]">
            <button
              type="button"
              onClick={() => setSourceType("order")}
              className={`py-2.5 px-3 rounded-[2px] text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                sourceType === "order"
                  ? "bg-white text-shop-ink border border-shop-line"
                  : "text-shop-muted hover:text-shop-ink"
              }`}
            >
              <ShoppingBag className="w-4 h-4" /> Por Pedido / Venta
            </button>
            <button
              type="button"
              onClick={() => setSourceType("op")}
              className={`py-2.5 px-3 rounded-[2px] text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                sourceType === "op"
                  ? "bg-white text-shop-ink border border-shop-line"
                  : "text-shop-muted hover:text-shop-ink"
              }`}
            >
              <Layers className="w-4 h-4" /> Por OP (Producción)
            </button>
            <button
              type="button"
              onClick={() => setSourceType("manual")}
              className={`py-2.5 px-3 rounded-[2px] text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                sourceType === "manual"
                  ? "bg-white text-shop-ink border border-shop-line"
                  : "text-shop-muted hover:text-shop-ink"
              }`}
            >
              <Package className="w-4 h-4" /> Salida Manual
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between gap-3 p-3 bg-blue-50 rounded-xl"><strong className="text-sm">{guideMode === "CON_GUIA" ? "CON GUÍA" : "SIN GUÍA"}</strong><button type="button" disabled={isSubmitting || photoReading} onClick={() => setGuideMode(null)} className="text-sm text-blue-700 underline">Cambiar modalidad</button></div>
            {guideMode === "CON_GUIA" && <GuideEvidenceFields number={guideNumber} photo={guidePhoto} onNumberChange={setGuideNumber} onPhotoChange={setGuidePhoto} disabled={isSubmitting || photoReading} onBusyChange={setPhotoReading} onError={setSubmitError} />}
            {submitError && <p role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 p-3 rounded-xl">{submitError}</p>}
            <fieldset disabled={isSubmitting || photoReading} className="space-y-5 min-w-0 border-0 p-0">
            {/* SOURCE: ORDER */}
            {sourceType === "order" && (
              <div className="space-y-4">
                {eligibleOrders.length === 0 ? (
                  <div className="p-4 bg-shop-light border border-shop-line rounded-[2px] space-y-3">
                    <div className="flex items-center gap-2 text-shop-muted">
                      <Package className="w-4 h-4 text-shop-muted" />
                      <p className="text-xs font-medium">No hay pedidos listos para autorizar salida en este momento.</p>
                    </div>
                    <p className="text-[11px] text-shop-muted leading-relaxed">
                      Los pedidos personalizados a medida deben primero completar todas sus etapas en <strong>Taller / Producción</strong> (100%) y el almacenero debe dar clic en <strong>"Aceptar Ingreso"</strong> para que las prendas ingresen formalmente a Almacén.
                    </p>
                    {inProgressOrders.length > 0 && (
                      <div className="pt-2 border-t border-shop-line/80 space-y-2">
                        <p className="text-[11px] font-semibold text-shop-muted">
                          Pedidos en Fabricación / Pendientes de Ingreso ({inProgressOrders.length}):
                        </p>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {inProgressOrders.map((ord) => (
                            <div key={ord.id} className="flex items-center justify-between text-[11px] bg-white p-2.5 rounded-[2px] border border-shop-line">
                              <div>
                                <span className="font-medium text-shop-ink">{ord.id} • {ord.customerName}</span>
                                <span className="text-[11px] text-shop-muted tabular-nums ml-2">({ord.type === "pedido" ? "A Pedido" : "Venta Directa"})</span>
                              </div>
                              <span className="tabular-nums text-[11px] bg-shop-light text-shop-blue px-2 py-0.5 rounded-[2px] font-medium border border-shop-light">
                                {ord.statusMessage}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-shop-muted pl-1">
                      Seleccionar Pedido con Ingreso Aceptado en Almacén
                    </label>
                    <select
                      value={selectedOrderId}
                      onChange={(e) => setSelectedOrderId(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-white border border-shop-line rounded-[2px] font-medium text-shop-ink outline-none focus:ring-2 focus:ring-shop-blue/20 min-h-10 min-w-0 text-base sm:text-[13px]"
                    >
                      <option value="" disabled>
                        Seleccione una orden lista en almacén...
                      </option>
                      {eligibleOrders.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.id} • {o.customerName} (S/ {o.total?.toFixed(2)}) - {o.type === "pedido" ? "A Pedido (En Almacén)" : "Venta Directa"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {orderExistingSalida && (
                  <div className={`p-3 rounded-[2px] border text-xs font-medium flex items-center gap-2.5 ${
                    orderExistingSalida.status === "Aceptado"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}>
                    {orderExistingSalida.status === "Aceptado" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <strong className="font-medium">Movimiento {orderExistingSalida.id} existente:</strong> Estado: <strong>{orderExistingSalida.status}</strong>.
                      {orderExistingSalida.status === "Aceptado" && " Este pedido ya tiene salida aprobada y está listo para despachar en Ventas."}
                    </div>
                  </div>
                )}

                {selectedOrder && (
                  <div className="bg-shop-light/70 p-4 rounded-[2px] border border-shop-line space-y-3">
                    <div className="flex items-center justify-between text-xs border-b border-shop-line pb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-shop-muted" />
                        <span className="font-medium text-shop-ink">{selectedOrder.customerName}</span>
                      </div>
                      <span className="tabular-nums text-[11px] bg-slate-200 px-2 py-0.5 rounded-[2px] font-semibold text-shop-muted">
                        {selectedOrder.type === "pedido" ? "A PEDIDO (EN ALMACÉN)" : "VENTA DIRECTA"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-shop-muted">
                        Prendas a Despachar:
                      </p>
                      {orderStockCheck.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs bg-white p-2.5 rounded-[2px] border border-shop-line"
                        >
                          <div>
                            <p className="font-medium text-shop-ink">{it.productName}</p>
                            <p className="text-[11px] text-shop-muted tabular-nums">
                              Solicitado: <strong className="text-shop-blue">{it.required} Uds</strong> {it.selectedSize ? `(Talla ${it.selectedSize})` : ""}
                            </p>
                          </div>
                          <div className="text-right tabular-nums text-[11px]">
                            <span
                              className={`px-2 py-0.5 rounded-[2px] font-semibold ${
                                it.isSufficient
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              Stock Físico: {it.available} Uds
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {!orderStockCheck.canFulfill && (
                      <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1.5 mt-2 bg-rose-50 p-2 rounded-[2px] border border-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        Atención: El stock físico en almacén es menor a la cantidad requerida. Verifica si la OP ya ingresó a almacén.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SOURCE: OP */}
            {sourceType === "op" && (
              <div className="space-y-4">
                {eligibleOps.length === 0 ? (
                  <div className="p-4 bg-shop-light border border-shop-line rounded-[2px] space-y-3">
                    <div className="flex items-center gap-2 text-shop-muted">
                      <Layers className="w-4 h-4 text-shop-muted" />
                      <p className="text-xs font-medium">No hay OPs con ingreso aceptado en almacén pendientes de salida.</p>
                    </div>
                    <p className="text-[11px] text-shop-muted leading-relaxed">
                      Una Orden de Producción (OP) solo puede registrar salida una vez que finalice todas sus etapas en Taller (100%) y se haya aceptado su movimiento de <strong>Ingreso a Almacén</strong>.
                    </p>
                    {inProgressOps.length > 0 && (
                      <div className="pt-2 border-t border-shop-line/80 space-y-2">
                        <p className="text-[11px] font-semibold text-shop-muted">
                          OPs en Fabricación o Pendientes de Ingreso ({inProgressOps.length}):
                        </p>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {inProgressOps.map((opItem) => (
                            <div key={opItem.id} className="flex items-center justify-between text-[11px] bg-white p-2.5 rounded-[2px] border border-shop-line">
                              <div>
                                <span className="font-medium text-shop-ink">{opItem.id} {opItem.orderId ? `• Pedido: ${opItem.orderId}` : "• Autostock"}</span>
                              </div>
                              <span className="tabular-nums text-[11px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-[2px] font-medium border border-amber-200">
                                {!opItem.isFinished
                                  ? `Etapa: ${opItem.currentStage} (${Math.round(opItem.progress || 0)}%)`
                                  : opItem.isIngresoPending
                                    ? `Ingreso ${opItem.ingresoMovement?.id} pendiente de aceptar en almacén`
                                    : "OP 100% • Falta generar ingreso en almacén"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-shop-muted pl-1">
                      Seleccionar Orden de Producción (OP en Almacén)
                    </label>
                    <select
                      value={selectedOpId}
                      onChange={(e) => setSelectedOpId(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-white border border-shop-line rounded-[2px] font-medium text-shop-ink outline-none focus:ring-2 focus:ring-shop-blue/20 min-h-10 min-w-0 text-base sm:text-[13px]"
                    >
                      <option value="" disabled>
                        Seleccione una OP en almacén...
                      </option>
                      {eligibleOps.map((op) => (
                        <option key={op.id} value={op.id}>
                          {op.id} {op.orderId ? `• Pedido: ${op.orderId}` : "• Autostock"} [Ingreso Aceptado en Almacén]
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {opExistingSalida && (
                  <div className="p-3 rounded-[2px] border bg-amber-50 text-amber-800 border-amber-200 text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Ya existe una salida registrada para esta OP: <strong>{opExistingSalida.id} ({opExistingSalida.status})</strong></span>
                  </div>
                )}

                {selectedOp && (
                  <div className="bg-shop-light/70 p-4 rounded-[2px] border border-shop-line space-y-3">
                    <div className="flex items-center justify-between text-xs border-b border-shop-line pb-2">
                      <span className="font-medium text-shop-ink tabular-nums">OP: {selectedOp.id}</span>
                      <span className="tabular-nums text-[11px] bg-shop-light text-shop-blue px-2 py-0.5 rounded-[2px] font-semibold">
                        Etapa: {selectedOp.currentStage}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-shop-muted">
                        Prendas producidas en esta OP:
                      </p>
                      {selectedOp.items?.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs bg-white p-2.5 rounded-[2px] border border-shop-line tabular-nums"
                        >
                          <span className="font-medium text-shop-ink">{it.productName || it.productId}</span>
                          <span className="font-semibold text-shop-blue">
                            {(it.quantityOrdered || 0) + (it.quantityExtras || 0)} Uds {it.selectedSize ? `(${it.selectedSize})` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SOURCE: MANUAL */}
            {sourceType === "manual" && (
              <div className="space-y-4">
                <div className="bg-shop-light/70 p-4 rounded-[2px] border border-shop-line space-y-3">
                  <label className="text-[11px] font-semibold text-shop-muted pl-1">
                    Agregar Prenda Manual
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={manualProductId}
                      onChange={(e) => setManualProductId(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-shop-line rounded-[2px] font-medium text-shop-muted outline-none min-h-10 min-w-0 text-base sm:text-[13px]"
                    >
                      <option value="" disabled>
                        Seleccione producto...
                      </option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock: {p.stockPhysical || 0})
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Talla (S, M, L)"
                      value={manualSize}
                      onChange={(e) => setManualSize(e.target.value)}
                      className="w-24 px-3 py-2 bg-white border border-shop-line rounded-[2px] font-medium outline-none min-h-10 min-w-0 text-base sm:text-[13px]"
                    />

                    <input
                      type="number"
                      min="1"
                      placeholder="Cant"
                      value={manualQuantity}
                      onChange={(e) => setManualQuantity(Number(e.target.value))}
                      className="w-20 px-3 py-2 bg-white border border-shop-line rounded-[2px] tabular-nums font-medium outline-none min-h-10 min-w-0 text-base sm:text-[13px]"
                    />

                    <button
                      type="button"
                      onClick={handleAddManualItem}
                      className="px-4 py-2 bg-shop-ink text-white rounded-[2px] text-xs font-medium hover:bg-shop-ink flex items-center justify-center gap-1 min-h-9"
                    >
                      <Plus className="w-4 h-4" /> Agregar
                    </button>
                  </div>

                  {manualItems.length > 0 ? (
                    <div className="space-y-2 mt-3">
                      {manualItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs bg-white p-2.5 rounded-[2px] border border-shop-line"
                        >
                          <div>
                            <p className="font-medium text-shop-ink">{item.productName}</p>
                            <p className="text-[11px] text-shop-muted tabular-nums">
                              Cant: {item.quantity} Uds • Talla: {item.selectedSize}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveManualItem(idx)}
                            className="p-1 text-shop-muted hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center border-2 border-dashed border-shop-line rounded-[2px]">
                      <p className="text-[11px] font-medium text-shop-muted tabular-nums">
                        Agregue las prendas para la salida manual
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Fields: Reason and Notes */}
            <div className="space-y-3 pt-1 border-t border-shop-line">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-shop-muted pl-1">
                  Motivo / Observaciones
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    sourceType === "order"
                      ? "Ejem: Salida por Despacho a Cliente / Courier"
                      : sourceType === "op"
                      ? "Ejem: Salida de lote completado para entrega"
                      : "Ejem: Ajuste de inventario, Merma o Muestra comercial"
                  }
                  className="w-full px-4 py-2.5 bg-white border border-shop-line rounded-[2px] font-medium outline-none focus:ring-2 focus:ring-shop-blue/20 min-h-10 min-w-0 text-base sm:text-[13px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-shop-muted pl-1">
                  Transportista / Responsable (Opcional)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-shop-muted" />
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ejem: Courier Olva / Carlos Almacenero"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-shop-line rounded-[2px] tabular-nums outline-none focus:ring-2 focus:ring-shop-blue/20 min-h-10 min-w-0 text-base sm:text-[13px]"
                  />
                </div>
              </div>

              {/* Auto Accept Switch */}
              <div className="flex items-center justify-between p-3 bg-shop-light/50 rounded-[2px] border border-shop-light">
                <div>
                  <p className="text-xs font-medium text-shop-ink">
                    Aprobar y Descontar Stock Inmediatamente
                  </p>
                  <p className="text-[11px] text-shop-muted font-medium">
                    {autoAccept
                      ? "Descuenta el stock físico, asienta en Kardex y activa el botón de Despacho en Ventas."
                      : "Crea la salida en estado 'Pendiente' para que el almacenero la verifique luego."}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoAccept}
                  onChange={(e) => setAutoAccept(e.target.checked)}
                  className="w-5 h-5 text-shop-blue rounded-[2px] focus:ring-shop-blue cursor-pointer"
                />
              </div>
            </div>

            </fieldset>
            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={close}
                className="flex-1 py-3 px-4 border border-shop-line rounded-[2px] text-xs font-medium text-shop-muted hover:bg-shop-light transition-colors min-h-9"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || photoReading || (sourceType === "order" && !selectedOrderId) || (sourceType === "op" && !selectedOpId) || (sourceType === "manual" && manualItems.length === 0)}
                className="flex-1 py-3 px-4 bg-shop-ink hover:bg-shop-ink text-white rounded-[2px] text-xs font-semibold transition-all disabled:bg-slate-200 disabled:text-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-9"
              >
                <Truck className="w-4 h-4" />
                {autoAccept ? "Aprobar y Habilitar Despacho" : "Crear Salida Pendiente"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </AdminDialog>
  );
}

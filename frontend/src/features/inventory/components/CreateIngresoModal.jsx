import React, { useState, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import {
  X,
  Package,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Plus,
  Trash2,
  ArrowRight,
  Boxes,
  Split
} from "lucide-react";

export default function CreateIngresoModal({
  isOpen,
  onClose,
  productionOrders = [],
  orders = [],
  products = [],
  warehouseMovements = [],
  onCreateIngreso,
  initialOpId = ""
}) {
  const [sourceType, setSourceType] = useState("op"); // "op", "manual"
  const [selectedOpId, setSelectedOpId] = useState(initialOpId || "");
  const [ingresoQuantity, setIngresoQuantity] = useState(0);
  const [selectedSublotId, setSelectedSublotId] = useState("");
  const [manualItems, setManualItems] = useState([]);
  const [manualProductId, setManualProductId] = useState("");
  const [manualQuantity, setManualQuantity] = useState(10);
  const [manualSize, setManualSize] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("Almacén Central");
  const [docRef, setDocRef] = useState("");
  const [autoAccept, setAutoAccept] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set initial OP if supplied and modal opened
  useEffect(() => {
    if (initialOpId) {
      setSelectedOpId(initialOpId);
      setSourceType("op");
    }
  }, [initialOpId, isOpen]);

  // Analyzed OPs with respect to completion and warehouse income
  const analyzedOps = useMemo(() => {
    return productionOrders.map((op) => {
      const isFinished = op.currentStage === "Finalizado" || (op.progress || 0) >= 100;

      const totalUnits = (op.items || []).reduce(
        (sum, item) => sum + (Number(item.quantityOrdered) || 0) + (Number(item.quantityExtras) || 0),
        0
      );

      // Find all Ingreso movements for this OP
      const opIngresos = warehouseMovements.filter(
        (wm) => wm.opId === op.id && wm.type === "Ingreso"
      );

      const ingressedUnits = opIngresos.reduce((sum, wm) => {
        const itemSum = (wm.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
        return sum + (itemSum || Number(wm.quantity) || 0);
      }, 0);

      const pendingUnits = Math.max(0, totalUnits - ingressedUnits);
      const isFullyIngressed = totalUnits > 0 && pendingUnits === 0;

      // Sublots analysis
      const sublotsList = Array.isArray(op.sublots) ? op.sublots : [];
      const finishedSublots = sublotsList.filter((sub) => {
        const lastStage = sub.stages?.find((st) => st.name === "Planchado y Empaquetado");
        return sub.status === "completed" || (lastStage && lastStage.status === "completed");
      });
      const hasFinishedSublots = finishedSublots.length > 0;

      // Eligible if pending units exist AND (OP is 100% finished OR at least one sublot finished or progress >= 20%)
      const canGenerateIngreso = pendingUnits > 0 && (isFinished || hasFinishedSublots || (op.progress || 0) >= 20);

      const associatedOrder = op.orderId ? orders.find((o) => o.id === op.orderId) : null;
      const isPedido = Boolean(op.orderId);

      return {
        ...op,
        isFinished,
        totalUnits,
        ingressedUnits,
        pendingUnits,
        isFullyIngressed,
        opIngresos,
        sublotsList,
        finishedSublots,
        hasFinishedSublots,
        associatedOrder,
        isPedido,
        canGenerateIngreso
      };
    });
  }, [productionOrders, orders, warehouseMovements]);

  // Eligible OPs: has pending units and finished OP or finished sublots
  const eligibleOps = useMemo(() => {
    return analyzedOps.filter((op) => op.canGenerateIngreso);
  }, [analyzedOps]);

  // OPs still in fabrication without any finished lot
  const inProgressOps = useMemo(() => {
    return analyzedOps.filter((op) => !op.canGenerateIngreso && !op.isFullyIngressed);
  }, [analyzedOps]);

  // Currently selected OP object
  const selectedOp = useMemo(() => {
    return analyzedOps.find((op) => op.id === selectedOpId);
  }, [analyzedOps, selectedOpId]);

  // Auto-select first eligible OP if none selected
  useEffect(() => {
    if (sourceType === "op" && !selectedOpId && eligibleOps.length > 0) {
      setSelectedOpId(eligibleOps[0].id);
    }
  }, [sourceType, selectedOpId, eligibleOps]);

  // Update quantity whenever selectedOp or selectedSublotId changes
  useEffect(() => {
    if (selectedOp) {
      if (selectedSublotId && selectedOp.sublotsList.length > 0) {
        const sub = selectedOp.sublotsList.find((s) => s.id === selectedSublotId);
        if (sub) {
          setIngresoQuantity(Math.min(sub.units, selectedOp.pendingUnits));
          setNotes(`Ingreso de ${sub.name} (${sub.units} uds)`);
          return;
        }
      }

      if (selectedOp.finishedSublots.length > 0) {
        const firstFin = selectedOp.finishedSublots[0];
        setIngresoQuantity(Math.min(firstFin.units, selectedOp.pendingUnits));
        setSelectedSublotId(firstFin.id);
        setNotes(`Ingreso de ${firstFin.name} (${firstFin.units} uds)`);
      } else {
        setIngresoQuantity(selectedOp.pendingUnits);
        setSelectedSublotId("");
      }
    }
  }, [selectedOp, selectedSublotId]);

  const handleAddManualItem = () => {
    if (!manualProductId) return;
    const prod = products.find((p) => p.id === manualProductId);
    if (!prod) return;

    setManualItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        quantity: Math.max(1, Number(manualQuantity) || 1),
        selectedSize: manualSize || "STD"
      }
    ]);

    setManualProductId("");
    setManualQuantity(10);
    setManualSize("");
  };

  const handleRemoveManualItem = (idx) => {
    setManualItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (sourceType === "op") {
        if (!selectedOpId) {
          alert("Por favor seleccione una Orden de Producción (OP).");
          return;
        }

        if (!selectedOp) {
          alert("No se encontró la OP seleccionada.");
          return;
        }

        if (selectedOp.pendingUnits <= 0) {
          alert(`Esta OP ya ingresó el 100% de sus prendas (${selectedOp.ingressedUnits}/${selectedOp.totalUnits} uds).`);
          return;
        }

        const qtyToIngress = Math.max(1, Math.min(Number(ingresoQuantity) || 1, selectedOp.pendingUnits));

        const sublotObj = selectedOp.sublotsList.find((s) => s.id === selectedSublotId);
        const sublotLabel = sublotObj ? ` - ${sublotObj.name}` : "";

        const payload = {
          opId: selectedOp.id,
          orderId: selectedOp.orderId || null,
          originType: selectedOp.isPedido ? "A Pedido" : "Autostock",
          reason: reason || `Ingreso de producción (${qtyToIngress} uds${sublotLabel}) - OP ${selectedOp.id}`,
          notes: notes ? `${notes} (Ubicación: ${location || "Almacén Central"})` : `Ubicación: ${location || "Almacén Central"}`,
          autoAccept,
          items: (selectedOp.items || []).map((i) => ({
            productId: i.productId,
            productName: i.productName || "Prenda",
            quantity: qtyToIngress,
            selectedSize: i.selectedSize
          }))
        };

        const res = await onCreateIngreso(payload);
        if (res && res.success) {
          onClose();
        }
      } else {
        // Manual mode
        if (manualItems.length === 0) {
          alert("Debe agregar al menos un producto a la lista de ingreso.");
          return;
        }

        const payload = {
          items: manualItems,
          originType: "Ingreso Manual",
          reason: reason || "Ingreso manual a inventario de almacén",
          notes: notes ? `${notes} (Guía: ${docRef || "S/G"} | Ubicación: ${location || "Almacén"})` : `Guía: ${docRef || "S/G"} | Ubicación: ${location || "Almacén"}`,
          autoAccept
        };

        const res = await onCreateIngreso(payload);
        if (res && res.success) {
          onClose();
        }
      }
    } catch (err) {
      console.error("Error al registrar ingreso:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
      >
        <div className="p-7 space-y-6 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-150">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                  Generar Ingreso a Almacén
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-serif italic">
                El almacenero verifica físicamente las prendas y autoriza el ingreso (total o por lotes de taller).
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Type Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setSourceType("op")}
              className={`py-2.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                sourceType === "op"
                  ? "bg-white text-slate-950 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers className="w-4 h-4" /> Por Orden de Producción (OP / Lotes)
            </button>
            <button
              type="button"
              onClick={() => setSourceType("manual")}
              className={`py-2.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                sourceType === "manual"
                  ? "bg-white text-slate-950 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Boxes className="w-4 h-4" /> Ingreso Manual / Directo
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* TAB: POR ORDEN DE PRODUCCIÓN */}
            {sourceType === "op" && (
              <div className="space-y-4">
                {eligibleOps.length === 0 ? (
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>No hay OPs con prendas terminadas pendientes de ingresar a almacén.</span>
                    </div>
                    <p className="text-[11px] text-amber-700 leading-relaxed pl-6">
                      Para generar un ingreso, la OP o su respectivo lote debe haber completado la etapa de <strong>Planchado y Empaquetado</strong> en el taller.
                    </p>

                    {inProgressOps.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-amber-200/60 pl-6 space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                          OPs en proceso de taller ({inProgressOps.length}):
                        </p>
                        <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                          {inProgressOps.map((op) => (
                            <div
                              key={op.id}
                              className="flex items-center justify-between text-[11px] bg-white/70 px-2.5 py-1.5 rounded border border-amber-200/50"
                            >
                              <span className="font-mono font-bold text-slate-800">{op.id}</span>
                              <span className="text-amber-800 font-medium">
                                Etapa: {op.currentStage} ({Math.round(op.progress || 0)}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                      Seleccionar Orden de Producción
                    </label>
                    <select
                      value={selectedOpId}
                      onChange={(e) => setSelectedOpId(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="" disabled>Seleccione una OP con saldo disponible...</option>
                      {eligibleOps.map((op) => (
                        <option key={op.id} value={op.id}>
                          {op.id} {op.orderId ? `• Pedido: ${op.orderId}` : "• Autostock"} ({op.pendingUnits} uds pendientes de {op.totalUnits} uds)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Selected OP details card */}
                {selectedOp && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-slate-900">{selectedOp.id}</span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded font-mono ${
                            selectedOp.isPedido
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {selectedOp.isPedido ? `A Pedido (${selectedOp.orderId})` : "Autostock"}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {selectedOp.isFinished ? "100% Producción" : `En Fabricación (${Math.round(selectedOp.progress || 0)}%)`}
                      </span>
                    </div>

                    {selectedOp.associatedOrder && (
                      <div className="text-xs text-slate-600 flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Cliente: <strong className="text-slate-800">{selectedOp.associatedOrder.client || selectedOp.associatedOrder.customerName || "Cliente"}</strong></span>
                      </div>
                    )}

                    {/* Balance Counters */}
                    <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-center">
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase font-black">Total OP</p>
                        <p className="text-sm font-black text-slate-900">{selectedOp.totalUnits} uds</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase font-black">Ya Ingresado</p>
                        <p className="text-sm font-black text-blue-600">+{selectedOp.ingressedUnits} uds</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase font-black">Saldo Pendiente</p>
                        <p className="text-sm font-black text-emerald-600">{selectedOp.pendingUnits} uds</p>
                      </div>
                    </div>

                    {/* Sublot selector if OP has sublots */}
                    {selectedOp.sublotsList && selectedOp.sublotsList.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1 font-mono">
                          <Split className="w-3 h-3 text-purple-600" /> Seleccionar Lote de Taller:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedOp.sublotsList.map((sub) => {
                            const isFin = sub.status === "completed" || (sub.stages?.some(st => st.name === "Planchado y Empaquetado" && st.status === "completed"));
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => {
                                  setSelectedSublotId(sub.id);
                                  setIngresoQuantity(Math.min(sub.units, selectedOp.pendingUnits));
                                  setNotes(`Lote: ${sub.name} (${sub.units} uds)`);
                                }}
                                className={`p-2.5 rounded-lg border text-left transition-all ${
                                  selectedSublotId === sub.id
                                    ? "bg-purple-50 border-purple-300 ring-2 ring-purple-500/20"
                                    : "bg-white border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-xs text-slate-900">{sub.name}</span>
                                  <span className="font-mono font-black text-xs text-purple-700">{sub.units} uds</span>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  {isFin ? "✓ Terminado en Empaque" : `En curso: ${sub.currentStage || "Taller"}`}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Quantity to ingress input */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 font-mono">
                          Cantidad a Ingresar Físicamente a Almacén:
                        </label>
                        <span className="text-[10px] font-mono text-slate-400">
                          Máximo: {selectedOp.pendingUnits} uds
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max={selectedOp.pendingUnits}
                          value={ingresoQuantity}
                          onChange={(e) => setIngresoQuantity(Math.min(selectedOp.pendingUnits, Math.max(1, Number(e.target.value))))}
                          className="w-32 px-3 py-2 bg-white border border-emerald-300 rounded-xl text-sm font-mono font-black text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                        <span className="text-xs font-bold text-slate-600">unidades físicas contadas</span>
                      </div>
                    </div>

                    {/* Items preview */}
                    <div className="space-y-1 pt-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Prendas verificadas que ingresarán al stock:
                      </p>
                      <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                        {(selectedOp.items || []).map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200"
                          >
                            <span className="font-semibold text-slate-800">{item.productName}</span>
                            <span className="font-mono font-black text-emerald-600">+{ingresoQuantity} uds</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: MANUAL / DIRECTO */}
            {sourceType === "manual" && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Agregar Prenda al Ingreso
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <select
                      value={manualProductId}
                      onChange={(e) => setManualProductId(e.target.value)}
                      className="md:col-span-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                    >
                      <option value="">Seleccione producto...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Talla (opc.)"
                      value={manualSize}
                      onChange={(e) => setManualSize(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none"
                    />

                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        min="1"
                        value={manualQuantity}
                        onChange={(e) => setManualQuantity(Number(e.target.value))}
                        className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-black outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddManualItem}
                        className="flex-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Agregar
                      </button>
                    </div>
                  </div>

                  {manualItems.length > 0 && (
                    <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {manualItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-slate-200"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{item.productName}</span>
                            <span className="text-[10px] text-slate-400 font-mono ml-2">Talla: {item.selectedSize}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-emerald-600">+{item.quantity} uds</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveManualItem(idx)}
                              className="text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Common fields: Reason, Notes, Location */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Motivo / Glosa
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="ej: Ingreso de producción terminada"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Ubicación en Almacén
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="ej: Almacén Central - Estante B"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Notas Adicionales / Lote
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ej: Verificado físicamente por el almacenero"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Auto accept toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoAcceptIngreso"
                  checked={autoAccept}
                  onChange={(e) => setAutoAccept(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="autoAcceptIngreso" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Aprobar e ingresar a inventario físico inmediatamente (Kardex)
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all uppercase font-mono"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (sourceType === "op" && (!selectedOp || selectedOp.pendingUnits <= 0))}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-900/20 active:scale-95 flex items-center gap-1.5 font-mono"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? "Registrando..." : "Registrar Ingreso de Almacén"}</span>
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

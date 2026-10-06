import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Calendar,
  FileText,
  DollarSign,
  Package,
  Layers,
  CheckCircle2,
  Clock,
  Scissors,
  Sparkles,
  Flame,
  Tags,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function SupplierHistoryModal({
  isOpen,
  onClose,
  supplier,
  onAddRecord,
  onDeleteRecord
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);
  const [recordError, setRecordError] = useState("");

  const [recordForm, setRecordForm] = useState({
    date: new Date().toISOString().split("T")[0],
    reference: "",
    description: "",
    quantity: "",
    unit: supplier?.specialty === "Insumos" ? "unidades" : "prendas",
    unitCost: supplier?.unitCostRate || "",
    totalCost: "",
    notes: ""
  });

  if (!isOpen || !supplier) return null;

  const isService = supplier.specialty !== "Insumos" && supplier.type !== "Insumos";
  const history = Array.isArray(supplier.history) ? supplier.history : [];

  const handleQtyOrCostChange = (qtyVal, costVal) => {
    const q = parseFloat(qtyVal) || 0;
    const c = parseFloat(costVal) || 0;
    const tot = q * c;
    setRecordForm((prev) => ({
      ...prev,
      quantity: qtyVal,
      unitCost: costVal,
      totalCost: tot > 0 ? tot.toFixed(2) : ""
    }));
  };

  const handleSaveRecord = async (e) => {
    e.preventDefault();
    if (!recordForm.reference && !recordForm.description) {
      setRecordError("Por favor ingresa una referencia (ej. OP-101) o descripción.");
      return;
    }

    try {
      setSavingRecord(true);
      setRecordError("");
      const qty = parseFloat(recordForm.quantity) || 0;
      const uCost = parseFloat(recordForm.unitCost) || 0;
      const totCost = recordForm.totalCost ? parseFloat(recordForm.totalCost) : qty * uCost;

      await onAddRecord(supplier.id || supplier._id, {
        date: recordForm.date,
        type: isService ? "Servicio" : "Compra",
        specialty: supplier.specialty,
        reference: recordForm.reference,
        description:
          recordForm.description ||
          (isService
            ? `Servicio de ${supplier.specialty} (${qty} prendas)`
            : `Compra de ${supplier.insumoDetails || "insumos"} (${qty} unidades)`),
        quantity: qty,
        unit: recordForm.unit,
        unitCost: uCost,
        totalCost: totCost,
        notes: recordForm.notes,
        status: "Completado"
      });

      // Reset form
      setRecordForm({
        date: new Date().toISOString().split("T")[0],
        reference: "",
        description: "",
        quantity: "",
        unit: isService ? "prendas" : "unidades",
        unitCost: supplier?.unitCostRate || "",
        totalCost: "",
        notes: ""
      });
      setShowAddForm(false);
    } catch (err) {
      setRecordError(err.message || "Error al registrar");
    } finally {
      setSavingRecord(false);
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (window.confirm("¿Seguro que deseas eliminar este registro del historial?")) {
      try {
        await onDeleteRecord(supplier.id || supplier._id, recordId);
      } catch (err) {
        alert("Error al eliminar: " + err.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight">{supplier.name}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    isService
                      ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                  }`}
                >
                  {supplier.specialty}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-serif italic">
                {isService
                  ? `Control de servicios brindados (Tercerización de ${supplier.specialty})`
                  : `Control de insumos adquiridos (${supplier.insumoDetails || "Avíos y materiales"})`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {isService ? (
              <>
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-1">
                    Servicios Brindados
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-blue-950 font-mono">
                      {supplier.servicesCount || history.length || 0}
                    </span>
                    <span className="text-xs text-blue-700 font-medium">veces / pedidos</span>
                  </div>
                  <span className="text-[10px] text-blue-600 block mt-1">
                    OPs completadas por este taller
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Prendas Procesadas
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {supplier.totalUnitsProcessed || 0}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">prendas</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    En etapa de {supplier.specialty}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-1">
                    Monto Total Pagado / Facturado
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-amber-950 font-mono">
                      S/ {(supplier.totalSpent || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-700 block mt-1">
                    Costo acumulado por servicios
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                    Compras de Insumos
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-emerald-950 font-mono">
                      {supplier.purchasesCount || history.length || 0}
                    </span>
                    <span className="text-xs text-emerald-700 font-medium">compras realizadas</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 block mt-1">
                    Órdenes y facturas de insumos
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Total Insumos Adquiridos
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {(supplier.totalUnitsPurchased || 0).toLocaleString("es-PE")}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">unidades / insumos</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Collarines, espaldar, agujas, etc.
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-1">
                    Inversión Total en Compras
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-amber-950 font-mono">
                      S/ {(supplier.totalSpent || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-700 block mt-1">
                    Monto total comprado
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {isService ? "Historial de Servicios Brindados" : "Historial de Insumos Comprados"}
              </h4>
              <p className="text-xs text-slate-500">
                {history.length} {history.length === 1 ? "registro guardado" : "registros guardados"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddForm((prev) => !prev)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Plus className={`w-4 h-4 transition-transform ${showAddForm ? "rotate-45" : ""}`} />
              <span>{isService ? "Registrar Servicio Brindado" : "Registrar Compra de Insumos"}</span>
            </button>
          </div>

          {/* Collapsible Record Entry Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSaveRecord}
                className="overflow-hidden border border-blue-200 bg-blue-50/40 rounded-xl p-4 space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-blue-200/60">
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    {isService ? "Nuevo Servicio Brindado" : "Nueva Compra de Insumos"}
                  </span>
                  <span className="text-[10px] text-blue-700 font-mono">
                    {supplier.name} • {supplier.specialty}
                  </span>
                </div>

                {recordError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{recordError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Fecha
                    </label>
                    <input
                      type="date"
                      required
                      value={recordForm.date}
                      onChange={(e) => setRecordForm({ ...recordForm, date: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Referencia (OP / Guía / Factura)
                    </label>
                    <input
                      type="text"
                      placeholder={isService ? "Ej: OP-104 / Lote 3" : "Ej: FAC-001-89"}
                      value={recordForm.reference}
                      onChange={(e) => setRecordForm({ ...recordForm, reference: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Descripción del Trabajo o Insumo
                    </label>
                    <input
                      type="text"
                      placeholder={
                        isService
                          ? `Ej: Costura de 120 camisas Oxford talla M y L`
                          : `Ej: 500 collarines rib blanco + 30 agujas DBx1`
                      }
                      value={recordForm.description}
                      onChange={(e) => setRecordForm({ ...recordForm, description: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      required
                      placeholder={isService ? "Prendas" : "Unidades"}
                      value={recordForm.quantity}
                      onChange={(e) => handleQtyOrCostChange(e.target.value, recordForm.unitCost)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Unidad de Medida
                    </label>
                    <select
                      value={recordForm.unit}
                      onChange={(e) => setRecordForm({ ...recordForm, unit: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="prendas">prendas</option>
                      <option value="unidades">unidades</option>
                      <option value="docenas">docenas</option>
                      <option value="millares">millares</option>
                      <option value="metros">metros</option>
                      <option value="conos">conos</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Costo Unitario (S/)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={recordForm.unitCost}
                      onChange={(e) => handleQtyOrCostChange(recordForm.quantity, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Costo Total (S/)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={recordForm.totalCost}
                      onChange={(e) => setRecordForm({ ...recordForm, totalCost: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingRecord}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    {savingRecord ? "Guardando..." : "Guardar Registro"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* History List */}
          {history.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Aún no hay registros guardados</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {isService
                  ? "Registra las veces que este taller te ha brindado servicio para llevar la cuenta de sus pedidos y prendas."
                  : "Registra las compras de insumos para llevar el control de cantidades y montos adquiridos."}
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-mono">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Referencia</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Detalle</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">
                      {isService ? "Prendas" : "Cantidad"}
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">
                      Costo Total
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                        {rec.date}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-800 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {rec.reference || "S/Ref"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="font-medium">{rec.description}</div>
                        {rec.notes && <div className="text-[10px] text-slate-400 italic">{rec.notes}</div>}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                        {rec.quantity} <span className="text-[10px] text-slate-500 font-normal">{rec.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                        S/ {(Number(rec.totalCost) || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                          title="Eliminar este registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Datos sincronizados con MongoDB Atlas</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

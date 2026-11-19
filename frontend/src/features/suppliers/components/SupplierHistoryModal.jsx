import AdminDialog from "@/components/admin/AdminDialog";
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
    <AdminDialog label="Historial del proveedor" onClose={onClose} className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-shop-ink/60 backdrop-blur-sm"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-3xl bg-white rounded-[2px] overflow-y-auto border border-shop-line max-h-[90vh] flex flex-col max-h-[90dvh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-shop-line flex items-center justify-between bg-shop-ink text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[2px] bg-shop-ink/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium tracking-tight">{supplier.name}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    isService
                      ? "bg-shop-ink/20 text-blue-300 border border-blue-400/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                  }`}
                >
                  {supplier.specialty}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-shop">
                {isService
                  ? `Control de servicios brindados (Tercerización de ${supplier.specialty})`
                  : `Control de insumos adquiridos (${supplier.insumoDetails || "Avíos y materiales"})`}
              </p>
            </div>
          </div>
          <button aria-label="Cerrar ventana"
            type="button"
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-[2px] hover:bg-shop-ink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-shop-ink">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {isService ? (
              <>
                <div className="p-4 rounded-[2px] bg-shop-light/70 border border-shop-line">
                  <span className="text-[11px] font-medium text-shop-blue block mb-1">
                    Servicios Brindados
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-semibold text-blue-950 tabular-nums">
                      {supplier.servicesCount || history.length || 0}
                    </span>
                    <span className="text-xs text-shop-blue font-medium">veces / pedidos</span>
                  </div>
                  <span className="text-[11px] text-shop-blue block mt-1">
                    OPs completadas por este taller
                  </span>
                </div>

                <div className="p-4 rounded-[2px] bg-shop-light border border-shop-line">
                  <span className="text-[11px] font-medium text-shop-muted block mb-1">
                    Prendas Procesadas
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-semibold text-shop-ink tabular-nums">
                      {supplier.totalUnitsProcessed || 0}
                    </span>
                    <span className="text-xs text-shop-muted font-medium">prendas</span>
                  </div>
                  <span className="text-[11px] text-shop-muted block mt-1">
                    En etapa de {supplier.specialty}
                  </span>
                </div>

                <div className="p-4 rounded-[2px] bg-amber-50/70 border border-amber-200">
                  <span className="text-[11px] font-medium text-amber-700 block mb-1">
                    Monto Total Pagado / Facturado
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-semibold text-amber-950 tabular-nums">
                      S/ {(supplier.totalSpent || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-700 block mt-1">
                    Costo acumulado por servicios
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 rounded-[2px] bg-emerald-50/70 border border-emerald-200">
                  <span className="text-[11px] font-medium text-emerald-800 block mb-1">
                    Compras de Insumos
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-semibold text-emerald-950 tabular-nums">
                      {supplier.purchasesCount || history.length || 0}
                    </span>
                    <span className="text-xs text-emerald-700 font-medium">compras realizadas</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 block mt-1">
                    Órdenes y facturas de insumos
                  </span>
                </div>

                <div className="p-4 rounded-[2px] bg-shop-light border border-shop-line">
                  <span className="text-[11px] font-medium text-shop-muted block mb-1">
                    Total Insumos Adquiridos
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-semibold text-shop-ink tabular-nums">
                      {(supplier.totalUnitsPurchased || 0).toLocaleString("es-PE")}
                    </span>
                    <span className="text-xs text-shop-muted font-medium">unidades / insumos</span>
                  </div>
                  <span className="text-[11px] text-shop-muted block mt-1">
                    Collarines, espaldar, agujas, etc.
                  </span>
                </div>

                <div className="p-4 rounded-[2px] bg-amber-50/70 border border-amber-200">
                  <span className="text-[11px] font-medium text-amber-700 block mb-1">
                    Inversión Total en Compras
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-semibold text-amber-950 tabular-nums">
                      S/ {(supplier.totalSpent || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-700 block mt-1">
                    Monto total comprado
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-shop-line">
            <div>
              <h4 className="text-sm font-medium text-shop-ink">
                {isService ? "Historial de Servicios Brindados" : "Historial de Insumos Comprados"}
              </h4>
              <p className="text-xs text-shop-muted">
                {history.length} {history.length === 1 ? "registro guardado" : "registros guardados"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddForm((prev) => !prev)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-shop-ink hover:bg-shop-ink text-white rounded-[2px] text-xs font-medium transition-all min-h-9"
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
                className="overflow-hidden border border-shop-line bg-shop-light/40 rounded-[2px] p-4 space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-shop-line/60">
                  <span className="text-xs font-medium text-blue-900 flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5 text-shop-blue" />
                    {isService ? "Nuevo Servicio Brindado" : "Nueva Compra de Insumos"}
                  </span>
                  <span className="text-[11px] text-shop-blue tabular-nums">
                    {supplier.name} • {supplier.specialty}
                  </span>
                </div>

                {recordError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-[2px] text-xs text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{recordError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-shop-muted">
                      Fecha
                    </label>
                    <input
                      type="date"
                      required
                      value={recordForm.date}
                      onChange={(e) => setRecordForm({ ...recordForm, date: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-shop-line rounded-[2px] outline-none focus:ring-1 focus:ring-shop-blue min-h-10 min-w-0 text-base sm:text-[13px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-shop-muted">
                      Referencia (OP / Guía / Factura)
                    </label>
                    <input
                      type="text"
                      placeholder={isService ? "Ej: OP-104 / Lote 3" : "Ej: FAC-001-89"}
                      value={recordForm.reference}
                      onChange={(e) => setRecordForm({ ...recordForm, reference: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-shop-line rounded-[2px] outline-none focus:ring-1 focus:ring-shop-blue tabular-nums min-h-10 min-w-0 text-base sm:text-[13px]"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-medium text-shop-muted">
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
                      className="w-full px-3 py-2 bg-white border border-shop-line rounded-[2px] outline-none focus:ring-1 focus:ring-shop-blue min-h-10 min-w-0 text-base sm:text-[13px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-shop-muted">
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
                      className="w-full px-3 py-2 bg-white border border-shop-line rounded-[2px] outline-none focus:ring-1 focus:ring-shop-blue tabular-nums min-h-10 min-w-0 text-base sm:text-[13px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-shop-muted">
                      Unidad de Medida
                    </label>
                    <select
                      value={recordForm.unit}
                      onChange={(e) => setRecordForm({ ...recordForm, unit: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-shop-line rounded-[2px] outline-none focus:ring-1 focus:ring-shop-blue min-h-10 min-w-0 text-base sm:text-[13px]"
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
                    <label className="text-[11px] font-medium text-shop-muted">
                      Costo Unitario (S/)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={recordForm.unitCost}
                      onChange={(e) => handleQtyOrCostChange(recordForm.quantity, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-shop-line rounded-[2px] outline-none focus:ring-1 focus:ring-shop-blue tabular-nums min-h-10 min-w-0 text-base sm:text-[13px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-shop-muted">
                      Costo Total (S/)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={recordForm.totalCost}
                      onChange={(e) => setRecordForm({ ...recordForm, totalCost: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-shop-line rounded-[2px] outline-none focus:ring-1 focus:ring-shop-blue tabular-nums font-medium text-shop-ink min-h-10 min-w-0 text-base sm:text-[13px]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 text-xs text-shop-muted hover:bg-shop-light rounded-[2px] font-medium min-h-9"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingRecord}
                    className="px-4 py-1.5 bg-shop-ink hover:bg-shop-ink text-white rounded-[2px] text-xs font-medium transition-all min-h-9"
                  >
                    {savingRecord ? "Guardando..." : "Guardar Registro"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* History List */}
          {history.length === 0 ? (
            <div className="py-12 text-center bg-shop-light border border-dashed border-shop-line rounded-[2px]">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-shop-muted">Aún no hay registros guardados</p>
              <p className="text-xs text-shop-muted max-w-sm mx-auto mt-1">
                {isService
                  ? "Registra las veces que este taller te ha brindado servicio para llevar la cuenta de sus pedidos y prendas."
                  : "Registra las compras de insumos para llevar el control de cantidades y montos adquiridos."}
              </p>
            </div>
          ) : (
            <div className="border border-shop-line rounded-[2px] overflow-x-auto max-w-full">
              <table className="w-full text-left text-xs min-w-[680px] text-[13px]">
                <thead className="bg-shop-light border-b border-shop-line tabular-nums">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium text-shop-muted whitespace-nowrap">Fecha</th>
                    <th className="px-4 py-3 text-xs font-medium text-shop-muted whitespace-nowrap">Referencia</th>
                    <th className="px-4 py-3 text-xs font-medium text-shop-muted whitespace-nowrap">Detalle</th>
                    <th className="px-4 py-3 text-xs font-medium text-shop-muted text-right whitespace-nowrap">
                      {isService ? "Prendas" : "Cantidad"}
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-shop-muted text-right whitespace-nowrap">
                      Costo Total
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-shop-muted text-center whitespace-nowrap">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-shop-line">
                  {history.map((rec) => (
                    <tr key={rec.id} className="hover:bg-shop-light/60 transition-colors">
                      <td className="px-4 py-3 tabular-nums text-shop-muted whitespace-nowrap">
                        {rec.date}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-shop-ink tabular-nums bg-shop-light px-2 py-0.5 rounded-[2px] border border-shop-line">
                          {rec.reference || "S/Ref"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-shop-muted">
                        <div className="font-medium">{rec.description}</div>
                        {rec.notes && <div className="text-[11px] text-shop-muted">{rec.notes}</div>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-shop-ink">
                        {rec.quantity} <span className="text-[11px] text-shop-muted font-normal">{rec.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-emerald-700">
                        S/ {(Number(rec.totalCost) || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="p-1 text-shop-muted hover:text-red-600 rounded-[2px] transition-colors"
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
        <div className="px-6 py-4 bg-shop-light border-t border-shop-line flex items-center justify-between text-xs text-shop-muted">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Datos sincronizados con MongoDB Atlas</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-shop-ink hover:bg-shop-ink text-white rounded-[2px] text-xs font-medium transition-all min-h-9"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </AdminDialog>
  );
}

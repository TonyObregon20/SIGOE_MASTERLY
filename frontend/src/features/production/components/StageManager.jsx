import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  User as UserIcon,
  Building2,
  Clock,
  Scissors,
  Sparkles,
  Package,
  Layers,
  Edit2,
  Check,
  AlertCircle,
  Phone,
  ArrowRight
} from "lucide-react";
import { getSuppliersApi } from "@/features/suppliers/suppliersApi";

/**
 * Helper to match suppliers relevant for a specific stage
 */
function getMatchingSuppliers(stageName, suppliers = []) {
  if (!Array.isArray(suppliers)) return [];
  const activeSuppliers = suppliers.filter((s) => s.status !== "Inactivo");

  switch (stageName) {
    case "Corte":
      return activeSuppliers.filter(
        (s) => s.specialty === "Corte" || s.category === "Corte"
      );
    case "Costura":
      return activeSuppliers.filter(
        (s) => s.specialty === "Costura" || s.category === "Costura"
      );
    case "Planchado y Empaquetado":
      return activeSuppliers.filter(
        (s) =>
          s.specialty === "Planchado" ||
          s.specialty === "Empaquetado" ||
          s.category === "Planchado" ||
          s.category === "Empaquetado"
      );
    case "Tendido":
    case "Limpieza":
    default:
      return [];
  }
}

/**
 * Returns stage-specific icon
 */
function getStageIcon(stageName) {
  switch (stageName) {
    case "Tendido":
      return <Layers className="w-4 h-4 text-shop-blue" />;
    case "Corte":
      return <Scissors className="w-4 h-4 text-shop-blue" />;
    case "Costura":
      return <Layers className="w-4 h-4 text-amber-500" />;
    case "Limpieza":
      return <Sparkles className="w-4 h-4 text-emerald-500" />;
    case "Planchado y Empaquetado":
      return <Package className="w-4 h-4 text-shop-blue" />;
    default:
      return <UserIcon className="w-4 h-4 text-shop-muted" />;
  }
}

/**
 * Production Stage Management Component
 * Allows selecting third-party suppliers (tercerizados) or internal operators for each stage:
 * - Tendido: defaults to "Operario de Tendido"
 * - Corte, Costura, Limpieza, Planchado y Empaquetado: dropdown of suppliers for that stage with multi-supplier support
 */
export default function StageManager({ op, updateStage, suppliers: propSuppliers = [], isModal = false }) {
  const [suppliersList, setSuppliersList] = useState(propSuppliers);
  const [editingStage, setEditingStage] = useState(null);
  const [stageSelections, setStageSelections] = useState({});

  // Sync or fetch suppliers
  useEffect(() => {
    if (Array.isArray(propSuppliers) && propSuppliers.length > 0) {
      setSuppliersList(propSuppliers);
    } else {
      getSuppliersApi()
        .then((data) => {
          if (Array.isArray(data)) setSuppliersList(data);
        })
        .catch((err) => console.error("Error loading suppliers in StageManager:", err));
    }
  }, [propSuppliers]);

  // Initialize selections for each stage from existing OP data
  useEffect(() => {
    if (!op || !Array.isArray(op.stages)) return;

    const initialSelections = {};
    op.stages.forEach((stg) => {
      const isInternal = stg.name === "Tendido" || stg.name === "Limpieza";
      const defaultOperator = stg.name === "Tendido" ? "Operario de Tendido" : "Operario de Limpieza";
      let chosenResponsible = stg.responsible || "";
      let chosenSupplierId = stg.supplierId || "";
      let isCustom = false;

      if (isInternal) {
        chosenResponsible = chosenResponsible || defaultOperator;
        isCustom = true;
      } else {
        // If no responsible set yet, try to default to first matching supplier
        if (!chosenResponsible && !chosenSupplierId) {
          const matching = getMatchingSuppliers(stg.name, suppliersList);
          if (matching.length > 0) {
            chosenSupplierId = matching[0].id || matching[0]._id;
            chosenResponsible = matching[0].name;
          } else {
            chosenResponsible = `Operario de ${stg.name}`;
            isCustom = true;
          }
        } else if (chosenSupplierId) {
          const found = suppliersList.find(
            (s) => s.id === chosenSupplierId || s._id === chosenSupplierId
          );
          if (found) chosenResponsible = found.name;
        } else if (chosenResponsible) {
          const found = suppliersList.find((s) => s.name === chosenResponsible);
          if (found) {
            chosenSupplierId = found.id || found._id;
          } else {
            isCustom = true;
          }
        }
      }

      initialSelections[stg.name] = {
        supplierId: chosenSupplierId,
        responsible: chosenResponsible,
        isCustom,
        customText: isCustom ? chosenResponsible : ""
      };
    });

    setStageSelections((prev) => ({ ...initialSelections, ...prev }));
  }, [op, suppliersList]);

  const handleSelectionChange = (stageName, value) => {
    if (value === "__custom__") {
      setStageSelections((prev) => ({
        ...prev,
        [stageName]: {
          ...prev[stageName],
          supplierId: "",
          isCustom: true,
          responsible: prev[stageName]?.customText || `Operario de ${stageName}`,
          customText: prev[stageName]?.customText || `Operario de ${stageName}`
        }
      }));
    } else {
      const selectedSupplier = suppliersList.find((s) => s.id === value || s._id === value);
      if (selectedSupplier) {
        setStageSelections((prev) => ({
          ...prev,
          [stageName]: {
            supplierId: selectedSupplier.id || selectedSupplier._id,
            responsible: selectedSupplier.name,
            isCustom: false,
            customText: ""
          }
        }));
      }
    }
  };

  const handleCustomTextChange = (stageName, text) => {
    setStageSelections((prev) => ({
      ...prev,
      [stageName]: {
        ...prev[stageName],
        responsible: text,
        customText: text
      }
    }));
  };

  const handleStartStage = (stageName) => {
    const sel = stageSelections[stageName];
    const isInternal = stageName === "Tendido" || stageName === "Limpieza";
    const defaultOp = stageName === "Tendido" ? "Operario de Tendido" : "Operario de Limpieza";
    const responsible = isInternal
      ? sel?.responsible || defaultOp
      : sel?.responsible || `Operario de ${stageName}`;
    const supplierId = sel?.isCustom || isInternal ? "" : sel?.supplierId || "";

    updateStage(op.id, stageName, "in-progress", responsible, supplierId);
    setEditingStage(null);
  };

  const handleFinishStage = (stage) => {
    const sel = stageSelections[stage.name];
    const responsible = sel?.responsible || stage.responsible || "Operario";
    const supplierId = sel?.supplierId || stage.supplierId || "";

    updateStage(op.id, stage.name, "completed", responsible, supplierId);
    setEditingStage(null);
  };

  const handleSaveResponsibleEdit = (stageName, currentStatus) => {
    const sel = stageSelections[stageName];
    const responsible = sel?.responsible || "Operario";
    const supplierId = sel?.isCustom ? "" : sel?.supplierId || "";

    updateStage(op.id, stageName, currentStatus, responsible, supplierId);
    setEditingStage(null);
  };

  return (
    <div className={isModal ? "p-3 md:p-4 bg-transparent border-0" : "p-6 md:p-8 bg-shop-light border-t border-shop-line"}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-shop-line/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-shop-ink tabular-nums">
              Flujo de Fases y Asignación de Tercerizados / Operarios
            </span>
            <span className="text-[11px] font-medium bg-shop-light text-shop-blue px-2 py-0.5 rounded-full">
              Lote {op.id}
            </span>
          </div>
          <p className="text-xs text-shop-muted">
            Configura el operario interno (Tendido y Limpieza) o selecciona el proveedor/tercerizado responsable de cada etapa del proceso.
          </p>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-medium text-shop-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Completado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-shop-ink" /> En Proceso
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Pendiente
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {op.stages?.map((stage, idx) => {
          const isInternalStage = stage.name === "Tendido" || stage.name === "Limpieza";
          const defaultOpName = stage.name === "Tendido" ? "Operario de Tendido" : "Operario de Limpieza";
          const stageAreaDesc =
            stage.name === "Tendido"
              ? "Área interna de taller (Tendido de tela)"
              : "Área interna de taller (Deshilachado y Limpieza)";
          const isFirstStage = idx === 0;
          const prevStage = idx > 0 ? op.stages[idx - 1] : null;
          const isPrevCompleted = isFirstStage || (prevStage && prevStage.status === "completed");
          const canStart = stage.status === "pending" && isPrevCompleted;
          const isWaiting = stage.status === "pending" && !isPrevCompleted;

          const sel = stageSelections[stage.name] || {};
          const isEditing = editingStage === stage.name;

          // Matching suppliers for this stage
          const matchingSuppliers = getMatchingSuppliers(stage.name, suppliersList);
          const otherServiceSuppliers = suppliersList.filter(
            (s) =>
              s.status !== "Inactivo" &&
              s.type === "Servicio" &&
              !matchingSuppliers.some((m) => m.id === s.id || m._id === s._id)
          );

          // Find current selected supplier object
          const currentSupplierObj = suppliersList.find(
            (s) => s.id === sel.supplierId || s._id === sel.supplierId
          );

          return (
            <div
              key={stage.name}
              className={`p-4 rounded-[2px] border transition-all flex flex-col justify-between ${
                stage.status === "completed"
                  ? "bg-white border-emerald-200/80"
                  : stage.status === "in-progress"
                  ? "bg-white border-blue-300 ring-2 ring-shop-blue/20"
                  : isWaiting
                  ? "bg-shop-light/70 border-shop-line opacity-80"
                  : "bg-white border-slate-250"
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-shop-line pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-shop-light flex items-center justify-center text-[11px] font-semibold text-shop-muted tabular-nums">
                      {idx + 1}
                    </span>
                    <span
                      className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                        stage.status === "completed"
                          ? "text-emerald-700"
                          : stage.status === "in-progress"
                          ? "text-shop-blue"
                          : isWaiting
                          ? "text-shop-muted"
                          : "text-shop-muted"
                      }`}
                    >
                      {getStageIcon(stage.name)}
                      {stage.name}
                    </span>
                  </div>

                  {stage.status === "completed" && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-[2px] border border-emerald-200 tabular-nums">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Fin
                    </span>
                  )}
                  {stage.status === "in-progress" && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-shop-blue bg-shop-light px-1.5 py-0.5 rounded-[2px] border border-shop-line tabular-nums">
                      En Curso
                    </span>
                  )}
                  {isWaiting && (
                    <span className="text-[11px] font-medium text-shop-muted tabular-nums">
                      Espera
                    </span>
                  )}
                  {canStart && (
                    <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-[2px] border border-amber-200 tabular-nums">
                      Listo
                    </span>
                  )}
                </div>

                {/* Responsible & Supplier Configuration Body */}
                <div className="space-y-3 mb-4">
                  {/* Tendido & Limpieza: Internal Operators */}
                  {isInternalStage ? (
                    <div className="space-y-1.5 bg-shop-light/80 p-2.5 rounded-[2px] border border-shop-line/80">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-shop-muted">
                        <span className="flex items-center gap-1">
                          <UserIcon className="w-3 h-3 text-shop-blue" /> Operario Interno
                        </span>
                        {(stage.status === "in-progress" || stage.status === "completed" || isEditing) && (
                          <button
                            type="button"
                            onClick={() => setEditingStage(isEditing ? null : stage.name)}
                            className="text-[11px] text-shop-blue hover:underline font-medium flex items-center gap-0.5"
                          >
                            <Edit2 className="w-2.5 h-2.5" /> {isEditing ? "Cerrar" : "Editar"}
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-2 pt-1">
                          <input
                            type="text"
                            value={sel.responsible || defaultOpName}
                            onChange={(e) => handleCustomTextChange(stage.name, e.target.value)}
                            placeholder={defaultOpName}
                            className="w-full px-2 py-1 bg-white border border-blue-300 rounded-[2px] font-semibold focus:ring-2 focus:ring-shop-blue/20 outline-none min-h-10 min-w-0 text-base sm:text-[13px]"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveResponsibleEdit(stage.name, stage.status)}
                            className="w-full py-1 bg-shop-ink hover:bg-shop-ink text-white rounded-[2px] text-[11px] font-medium flex items-center justify-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Guardar
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs font-medium text-shop-ink">
                          {stage.responsible || sel.responsible || defaultOpName}
                        </div>
                      )}
                      <p className="text-[11px] text-shop-muted">
                        {stageAreaDesc}
                      </p>
                    </div>
                  ) : (
                    /* Other Stages: Supplier or Internal Operator Picker */
                    <div className="space-y-2">
                      {/* View mode when not editing and (completed or in-progress) */}
                      {!isEditing && (stage.status === "in-progress" || stage.status === "completed") ? (
                        <div className="space-y-2 bg-shop-light p-2.5 rounded-[2px] border border-shop-line/80">
                          <div className="flex items-center justify-between text-[11px] font-medium text-shop-muted">
                            <span className="flex items-center gap-1 tabular-nums">
                              {stage.supplierId || currentSupplierObj ? (
                                <>
                                  <Building2 className="w-3 h-3 text-shop-blue" /> Tercerizado
                                </>
                              ) : (
                                <>
                                  <UserIcon className="w-3 h-3 text-shop-muted" /> Operario Interno
                                </>
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingStage(stage.name)}
                              className="text-[11px] text-shop-blue hover:underline font-medium flex items-center gap-0.5"
                            >
                              <Edit2 className="w-2.5 h-2.5" /> Cambiar
                            </button>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-shop-ink leading-tight">
                              {stage.responsible || sel.responsible || "No asignado"}
                            </p>
                            {currentSupplierObj && (
                              <div className="text-[11px] text-shop-muted tabular-nums space-y-0.5">
                                {currentSupplierObj.phone && (
                                  <p className="flex items-center gap-1">
                                    <Phone className="w-2.5 h-2.5 text-shop-muted" /> {currentSupplierObj.phone}
                                  </p>
                                )}
                                {currentSupplierObj.unitCostRate > 0 && (
                                  <p className="text-emerald-700 font-medium">
                                    Tarifa: S/ {currentSupplierObj.unitCostRate} por prenda
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Selector mode: when pending or user clicked 'Cambiar' */
                        <div className="space-y-2 bg-shop-light/40 p-2.5 rounded-[2px] border border-blue-150">
                          <label className="text-[11px] font-semibold text-shop-muted block">
                            A cargo de {stage.name}:
                          </label>

                          <select
                            value={sel.isCustom ? "__custom__" : sel.supplierId || ""}
                            onChange={(e) => handleSelectionChange(stage.name, e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-shop-line rounded-[2px] font-semibold text-shop-ink focus:ring-2 focus:ring-shop-blue/20 outline-none truncate min-h-10 min-w-0 text-base sm:text-[13px]"
                          >
                            <option value="" disabled>
                              -- Selecciona Proveedor o Encargado --
                            </option>

                            {matchingSuppliers.length > 0 && (
                              <optgroup label={`Proveedores de ${stage.name} (${matchingSuppliers.length})`}>
                                {matchingSuppliers.map((s) => (
                                  <option key={s.id || s._id} value={s.id || s._id}>
                                    {s.name} ({s.id || "PROV"})
                                  </option>
                                ))}
                              </optgroup>
                            )}

                            {otherServiceSuppliers.length > 0 && (
                              <optgroup label="Otros Proveedores de Servicios">
                                {otherServiceSuppliers.map((s) => (
                                  <option key={s.id || s._id} value={s.id || s._id}>
                                    {s.name} ({s.specialty || "Servicio"})
                                  </option>
                                ))}
                              </optgroup>
                            )}

                            <optgroup label="Interno / Manual">
                              <option value="__custom__">Operario Interno / Otro</option>
                            </optgroup>
                          </select>

                          {/* Custom operator input if selected */}
                          {sel.isCustom && (
                            <input
                              type="text"
                              value={sel.customText || ""}
                              onChange={(e) => handleCustomTextChange(stage.name, e.target.value)}
                              placeholder={`ej: Operario de ${stage.name}`}
                              className="w-full px-2 py-1 bg-white border border-shop-line rounded-[2px] font-semibold outline-none focus:ring-2 focus:ring-shop-blue/20 min-h-10 min-w-0 text-base sm:text-[13px]"
                            />
                          )}

                          {/* Matching supplier info preview */}
                          {currentSupplierObj && !sel.isCustom && (
                            <div className="text-[11px] text-shop-muted bg-white/80 p-1.5 rounded-[2px] border border-shop-line/60 tabular-nums space-y-0.5">
                              <p className="font-medium text-shop-blue truncate">{currentSupplierObj.name}</p>
                              {currentSupplierObj.phone && (
                                <p className="text-shop-muted">Tel: {currentSupplierObj.phone}</p>
                              )}
                              {currentSupplierObj.documentNumber && (
                                <p className="text-shop-muted">
                                  {currentSupplierObj.documentType || "RUC"}: {currentSupplierObj.documentNumber}
                                </p>
                              )}
                            </div>
                          )}

                          {matchingSuppliers.length === 0 && (
                            <p className="text-[11px] text-amber-700 flex items-center gap-1">
                              <AlertCircle className="w-2.5 h-2.5" /> No hay proveedores de {stage.name} registrados.
                            </p>
                          )}

                          {isEditing && (
                            <div className="flex items-center gap-1 pt-1">
                              <button
                                type="button"
                                onClick={() => handleSaveResponsibleEdit(stage.name, stage.status)}
                                className="flex-1 py-1 bg-shop-ink hover:bg-shop-ink text-white rounded-[2px] text-[11px] font-medium"
                              >
                                Guardar
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingStage(null)}
                                className="px-2 py-1 bg-slate-200 text-shop-muted rounded-[2px] text-[11px] font-medium"
                              >
                                Cancelar
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timestamps */}
                  {(stage.startTime || stage.endTime) && (
                    <div className="text-[11px] text-shop-muted font-medium tracking-tight tabular-nums space-y-0.5 pt-1 border-t border-shop-line">
                      {stage.startTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-shop-muted" />
                          <span>Ent: {stage.startTime.split(" ")[1] || stage.startTime}</span>
                        </div>
                      )}
                      {stage.endTime && (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Sal: {stage.endTime.split(" ")[1] || stage.endTime}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-shop-line">
                {stage.status === "pending" ? (
                  canStart ? (
                    <button
                      type="button"
                      onClick={() => handleStartStage(stage.name)}
                      className="w-full py-2 bg-shop-ink hover:bg-shop-ink text-white rounded-[2px] text-[11px] font-semibold transition-all flex items-center justify-center gap-1 tabular-nums"
                    >
                      <span>Iniciar {stage.name}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      title={`Debe completarse la etapa anterior (${prevStage?.name || "previa"})`}
                      className="w-full py-2 bg-shop-light border border-shop-line text-shop-muted rounded-[2px] text-[11px] font-medium cursor-not-allowed text-center truncate tabular-nums"
                    >
                      Espera: {prevStage?.name || "Anterior"}
                    </button>
                  )
                ) : stage.status === "in-progress" ? (
                  <button
                    type="button"
                    onClick={() => handleFinishStage(stage)}
                    className="w-full py-2 bg-shop-ink hover:bg-shop-blue text-white rounded-[2px] text-[11px] font-semibold transition-all flex items-center justify-center gap-1 tabular-nums"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Terminar Etapa</span>
                  </button>
                ) : (
                  <div className="w-full py-1.5 bg-emerald-50 border border-emerald-200 rounded-[2px] text-[11px] font-medium text-emerald-700 text-center tabular-nums flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Etapa Finalizada</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

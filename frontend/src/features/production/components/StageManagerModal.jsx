import React, { useEffect } from "react";
import { X, Maximize2, Layers } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import StageManager from "./StageManager";

/**
 * Fullscreen / Expanded Modal for Production Order Stage Management
 * Displays complete workflow, parallel sublots, and stage transitions comfortably.
 */
export default function StageManagerModal({
  isOpen,
  onClose,
  op,
  onUpdateStage,
  suppliers = []
}) {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !op) return null;

  const totalUnits = (op.items || []).reduce(
    (sum, i) => sum + (Number(i.quantityOrdered) || 0) + (Number(i.quantityExtras) || 0),
    0
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-7xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-10"
        >
          {/* Top Modal Header */}
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center font-mono font-black text-sm">
                <Layers className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black tracking-tight text-white font-mono">
                    Gestión de Fases - Fabricación Lote {op.id}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono tracking-wider ${
                      op.currentStage === "Finalizado"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    }`}
                  >
                    {op.currentStage}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {op.orderId ? `Asociado a ${op.orderId}` : "Autostock"} • {totalUnits} prendas totales • Progreso global: {Math.round(op.progress || 0)}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                title="Cerrar modal (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body: Scrollable Stage Manager */}
          <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6">
            <StageManager
              op={op}
              updateStage={onUpdateStage}
              suppliers={suppliers}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

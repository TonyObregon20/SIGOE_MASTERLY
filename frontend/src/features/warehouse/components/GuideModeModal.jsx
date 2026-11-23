import React from "react";

export default function GuideModeModal({ onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-[130] bg-slate-950/60 p-4 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="guide-mode-title">
      <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-white rounded-2xl p-5 sm:p-7 shadow-2xl space-y-5">
        <div className="flex justify-between items-start gap-4">
          <div><h2 id="guide-mode-title" className="text-xl font-bold text-slate-900">Generar salida de almacén</h2><p className="mt-2 text-sm text-slate-500">Elige la modalidad de esta salida.</p></div>
          <button type="button" aria-label="Cerrar selección de modalidad" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">✕</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button type="button" autoFocus onClick={() => onSelect("CON_GUIA")} className="text-left p-5 border-2 border-blue-600 rounded-xl hover:bg-blue-50 focus:ring-2 focus:ring-blue-500">
            <strong className="block text-blue-800">CON GUÍA</strong><span className="block text-sm text-slate-600 mt-2">Número manual y fotografía obligatorios. Se verificarán nuevamente al despachar.</span>
          </button>
          <button type="button" onClick={() => onSelect("SIN_GUIA")} className="text-left p-5 border-2 border-slate-200 rounded-xl hover:bg-slate-50 focus:ring-2 focus:ring-slate-500">
            <strong className="block text-slate-900">SIN GUÍA</strong><span className="block text-sm text-slate-600 mt-2">Continuar con el procedimiento habitual de almacén.</span>
          </button>
        </div>
      </div>
    </div>
  );
}

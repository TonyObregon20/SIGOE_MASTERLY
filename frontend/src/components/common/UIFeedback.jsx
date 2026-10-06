import React from "react";
import { AlertCircle } from "lucide-react";

export function ErrorMessage({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-bold underline hover:text-rose-900"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

export function LoadingSpinner({ text = "Cargando..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-3">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{text}</span>
    </div>
  );
}

export function EmptyState({ title = "No hay registros", description = "No se encontraron elementos para mostrar.", icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon className="w-12 h-12 text-slate-300 mb-3" />}
      <h4 className="text-sm font-bold text-slate-700">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm mt-1">{description}</p>
    </div>
  );
}

import React from "react";
import { BarChart3 } from "lucide-react";

/**
 * Bottom Analytical Widgets for Ecommerce view (Live feed sales & SEO tips)
 */
export default function EcommerceSalesSummary({ webTotalSales = 0, webOrdersCount = 0 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
      {/* Live Feed KPI Box */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-serif italic text-lg font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" /> Resumen de Ventas Web
          </h3>
          <span className="text-[9px] font-mono font-black text-blue-400 bg-blue-950/50 border border-blue-900 px-2 py-0.5 rounded-full uppercase tracking-widest">
            Live Feed
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-750">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 font-mono">
              Ingresos
            </p>
            <p className="text-2xl font-black text-white tracking-tighter font-mono">
              S/{" "}
              {webTotalSales.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-750">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 font-mono">
              Pedidos Completados
            </p>
            <p className="text-2xl font-black text-white tracking-tighter font-mono">
              {String(webOrdersCount).padStart(2, "0")}
            </p>
          </div>
        </div>
      </div>

      {/* SEO and Best Practices Advice Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-4 shadow-xs flex flex-col justify-between">
        <div className="space-y-1">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider font-mono">
            Consejos de Posicionamiento
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Mantén el catálogo actualizado y con descripciones detalladas para elevar el
            posicionamiento en buscadores (SEO). La visibilidad{" "}
            <strong className="text-emerald-600 font-bold">PÚBLICO</strong> permite a tus clientes
            encontrar y comprar tus camisas al instante desde la pasarela de pagos.
          </p>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-[11px] font-bold text-slate-400 font-mono">
          <span>Última actualización de catálogo:</span>
          <span className="text-slate-600 font-black">Hace unos instantes</span>
        </div>
      </div>
    </div>
  );
}

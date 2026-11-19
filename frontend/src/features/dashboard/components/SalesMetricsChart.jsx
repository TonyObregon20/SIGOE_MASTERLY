import React, { useState } from "react";
import { TrendingUp, BarChart3 } from "lucide-react";

/**
 * Interactive SVG Sales trend chart with tooltips and report button
 */
export default function SalesMetricsChart({
  totalSales = 0,
  totalShirtsSold = 0,
  dailySales = [],
  maxAmount = 1000,
  onOpenReport
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  return (
    <div className="lg:col-span-2 bg-white rounded-[2px] border border-shop-line flex flex-col p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-shop-line">
        <div className="space-y-1">
          <h3 className="font-medium text-shop-ink text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" /> Histórico y Tendencia de Ventas
          </h3>
          <p className="text-[11px] text-shop-muted font-medium tabular-nums">
            Total Vendido: <span className="text-shop-muted font-semibold text-xs">S/ {totalSales.toLocaleString()}</span> | {totalShirtsSold} camisas
          </p>
        </div>
        {onOpenReport && (
          <button
            onClick={onOpenReport}
            className="text-xs font-medium text-emerald-600 hover:underline flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-[2px] border border-emerald-100 transition-colors cursor-pointer self-start sm:self-auto min-h-9"
          >
            <BarChart3 className="w-4 h-4" /> Reporte y Descargas
          </button>
        )}
      </div>

      {/* SVG Chart Container */}
      <div className="flex-1 relative min-h-[220px]">
        {!dailySales.length && <p className="flex min-h-[220px] items-center justify-center text-sm text-shop-muted">Aún no hay ventas para mostrar.</p>}
        {dailySales.length > 0 && <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0e6ba8" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#0e6ba8" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = 30 + ratio * 120;
            const val = Math.round(maxAmount - ratio * maxAmount);
            return (
              <g key={i} className="opacity-100">
                <line x1="50" y1={y} x2="470" y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                <text x="12" y={y + 3} className="text-[10px] tabular-nums font-medium text-shop-muted fill-current">
                  S/ {val}
                </text>
              </g>
            );
          })}

          {/* X Axis Line */}
          <line x1="50" y1="150" x2="470" y2="150" stroke="#cbd5e1" strokeWidth="1.5" />

          {/* Chart Paths */}
          {(() => {
            const points = dailySales.map((d, idx) => {
              const x = (idx / (dailySales.length - 1 || 1)) * 420 + 50;
              const y = 150 - (d.amount / maxAmount) * 120;
              return { x, y };
            });

            if (points.length === 0) return null;

            const linePath = points.reduce((path, p, idx) => {
              return path + `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`;
            }, "");

            const areaPath = `${linePath} L ${points[points.length - 1].x} 150 L ${points[0].x} 150 Z`;

            return (
              <>
                <path d={areaPath} fill="url(#chartGrad)" />
                <path
                  d={linePath}
                  fill="none"
                  stroke="#0e6ba8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            );
          })()}

          {/* Interactive Circles & labels */}
          {dailySales.map((d, idx) => {
            const x = (idx / (dailySales.length - 1 || 1)) * 420 + 50;
            const y = 150 - (d.amount / maxAmount) * 120;
            const isHovered = hoveredPoint === idx;

            return (
              <g key={idx}>
                {/* X Axis Labels */}
                <text
                  x={x}
                  y="168"
                  className="text-[10px] tabular-nums font-medium text-shop-muted fill-current text-center"
                  textAnchor="middle"
                >
                  {d.displayDate || d.date}
                </text>

                {/* Outer glowing point */}
                {isHovered && (
                  <circle cx={x} cy={y} r="8" className="fill-shop-sky/50" />
                )}

                {/* Main point */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? "5" : "3"}
                  className={`fill-white stroke-2 transition-all ${
                    isHovered ? "stroke-shop-ink cursor-pointer" : "stroke-shop-blue"
                  }`}
                  onMouseEnter={() => setHoveredPoint(idx)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />

                {/* Large invisible catch circle for better mouse hit-testing */}
                <circle
                  cx={x}
                  cy={y}
                  r="16"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(idx)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}
        </svg>}

        {/* Custom Interactive Tooltip */}
        {hoveredPoint !== null && dailySales[hoveredPoint] && (
          <div
            className="absolute bg-shop-ink text-white rounded-[2px] p-3 text-xs tabular-nums space-y-0.5 border border-slate-800 z-10 transition-all pointer-events-none"
            style={{
              left: `${Math.min(
                Math.max(
                  (hoveredPoint / (dailySales.length - 1 || 1)) * 100 - 15,
                  2
                ),
                78
              )}%`,
              top: "2%"
            }}
          >
            <div className="font-medium text-[11px] text-emerald-400">
              {dailySales[hoveredPoint].date}
            </div>
            <div className="text-xs font-semibold text-white">
              Monto: S/ {dailySales[hoveredPoint].amount.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-300 font-medium">
              {dailySales[hoveredPoint].count} transacciones
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

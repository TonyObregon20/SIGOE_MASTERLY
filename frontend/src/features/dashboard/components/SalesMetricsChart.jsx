import { useEffect, useId, useRef, useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

const CHART_HEIGHT = 208;
const MARGIN = { top: 18, right: 20, bottom: 32, left: 70 };
const axisNumber = new Intl.NumberFormat('es-PE', {
  maximumFractionDigits: 0,
});
const compactNumber = new Intl.NumberFormat('es-PE', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export default function SalesMetricsChart({
  totalSales = 0,
  totalShirtsSold = 0,
  dailySales = [],
  maxAmount = 1000,
  onOpenReport,
}) {
  const container = useRef(null);
  const gradientId = useId();
  const [width, setWidth] = useState(600);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(1, Math.round(entry.contentRect.width)));
    });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  const plotWidth = Math.max(1, width - MARGIN.left - MARGIN.right);
  const plotHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;
  const baseline = CHART_HEIGHT - MARGIN.bottom;
  const scaleMax = Math.max(1, Number(maxAmount) || 0, ...dailySales.map(day => Number(day.amount) || 0));
  const points = dailySales.map((day, index) => ({
    ...day,
    x: MARGIN.left + (dailySales.length === 1 ? plotWidth / 2 : index * plotWidth / (dailySales.length - 1)),
    y: baseline - ((Number(day.amount) || 0) / scaleMax) * plotHeight,
  }));
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = points.length ? `${linePath} L ${points.at(-1).x} ${baseline} L ${points[0].x} ${baseline} Z` : '';
  const labelCount = Math.max(2, Math.floor(plotWidth / 76) + 1);
  const labelInterval = Math.max(1, Math.ceil((points.length - 1) / (labelCount - 1)));
  const activePoint = points[hoveredPoint];

  return (
    <section className="min-w-0 rounded-[2px] border border-shop-line bg-white p-4 sm:p-5 lg:col-span-2" aria-label="Histórico de ventas">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-shop-line pb-4">
        <div className="space-y-1">
          <h3 className="flex items-center gap-2 text-sm font-medium text-shop-ink">
            <TrendingUp size={17} strokeWidth={1.6} className="shrink-0 text-shop-blue" />
            Histórico y Tendencia de Ventas
          </h3>
          <p className="text-[11px] text-shop-muted tabular-nums">
            Total vendido <span className="font-medium text-shop-ink">S/ {totalSales.toLocaleString('es-PE')}</span>
            <span className="mx-2 text-slate-300" aria-hidden="true">·</span>
            {totalShirtsSold} camisas
          </p>
        </div>
        {onOpenReport && (
          <button type="button" onClick={onOpenReport} className="inline-flex min-h-9 items-center gap-2 rounded-[2px] border border-shop-line px-3 text-[11px] font-medium text-shop-ink transition-colors hover:bg-shop-light">
            <BarChart3 size={14} /> Reporte y Descargas
          </button>
        )}
      </div>

      <div ref={container} className="relative h-[208px] min-w-0">
        {!points.length ? (
          <p className="flex h-full items-center justify-center text-sm text-shop-muted">Aún no hay ventas para mostrar.</p>
        ) : (
          <svg viewBox={`0 0 ${width} ${CHART_HEIGHT}`} className="block h-full w-full overflow-visible" role="group" aria-label="Ventas diarias en soles">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0e6ba8" stopOpacity={0.13} />
                <stop offset="100%" stopColor="#0e6ba8" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
              const y = MARGIN.top + ratio * plotHeight;
              const amount = Math.round(scaleMax * (1 - ratio));
              return (
                <g key={ratio}>
                  <line x1={MARGIN.left} y1={y} x2={width - MARGIN.right} y2={y} stroke="#e2e8f0" strokeDasharray={ratio === 1 ? undefined : '3 5'} />
                  <text x={MARGIN.left - 12} y={y} dy=".35em" textAnchor="end" className="fill-shop-muted text-[11px] tabular-nums">
                    S/ {amount >= 10000 ? compactNumber.format(amount) : axisNumber.format(amount)}
                  </text>
                </g>
              );
            })}

            <path d={areaPath} fill={`url(#${gradientId})`} />
            {activePoint && <line x1={activePoint.x} y1={MARGIN.top} x2={activePoint.x} y2={baseline} stroke="#0e6ba8" strokeOpacity={0.25} strokeDasharray="3 4" />}
            <path d={linePath} fill="none" stroke="#0e6ba8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {points.map((point, index) => {
              const active = hoveredPoint === index;
              const showLabel = index % labelInterval === 0 || index === points.length - 1;
              return (
                <g key={`${point.date}-${index}`}>
                  {showLabel && <text x={point.x} y={baseline + 22} textAnchor="middle" className="fill-shop-muted text-[10px] tabular-nums">{point.displayDate || point.date}</text>}
                  {active && <circle cx={point.x} cy={point.y} r="7" fill="#a6e1fa" fillOpacity={0.55} />}
                  <circle cx={point.x} cy={point.y} r={active ? 3.5 : 2.5} fill="white" stroke={active ? '#001c55' : '#0e6ba8'} strokeWidth="1.75" />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="14"
                    fill="transparent"
                    tabIndex={0}
                    role="button"
                    aria-label={`${point.displayDate || point.date}, S/ ${point.amount}, ${point.count} ${point.count === 1 ? 'venta' : 'ventas'}`}
                    aria-pressed={active}
                    className="cursor-pointer outline-none"
                    onMouseEnter={() => setHoveredPoint(index)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    onFocus={() => setHoveredPoint(index)}
                    onBlur={() => setHoveredPoint(null)}
                    onClick={() => setHoveredPoint(index)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setHoveredPoint(index);
                      }
                    }}
                  />
                </g>
              );
            })}
          </svg>
        )}

        {activePoint && (
          <div className="pointer-events-none absolute top-0 z-10 w-[148px] rounded-[2px] bg-shop-ink px-3 py-2.5 text-white shadow-sm" role="status" style={{ left: Math.max(0, Math.min(activePoint.x - 74, width - 148)) }}>
            <p className="text-[10px] text-shop-sky">{activePoint.displayDate || activePoint.date}</p>
            <p className="mt-1 text-xs font-medium tabular-nums">S/ {Number(activePoint.amount).toLocaleString('es-PE')}</p>
            <p className="mt-0.5 text-[10px] text-slate-300">{activePoint.count} {activePoint.count === 1 ? 'venta' : 'ventas'}</p>
          </div>
        )}
      </div>
    </section>
  );
}

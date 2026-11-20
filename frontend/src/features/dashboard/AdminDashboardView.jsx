import StatCard from "@/components/ui/StatCard";
import React, { useState } from "react";
import {
  TrendingUp,
  Users as UsersIcon,
  ClipboardList,
  AlertCircle,
  User as UserIcon,
  Plus
} from "lucide-react";
import { useDashboardMetrics } from "./hooks/useDashboardMetrics";
import ProductionPipelineStatus from "./components/ProductionPipelineStatus";
import SalesMetricsChart from "./components/SalesMetricsChart";
import ProductionReportModal from "./components/modals/ProductionReportModal";
import SalesReportModal from "./components/modals/SalesReportModal";

/**
 * StatCard sub-component for top summary metrics
 */
/**
 * Primary Administrative Dashboard View
 */
export function AdminDashboardView({
  products = [],
  productionOrders = [],
  users = [],
  orders = [],
  createProductionOrder
}) {
  const [showProductionReport, setShowProductionReport] = useState(false);
  const [showSalesReport, setShowSalesReport] = useState(false);

  const {
    lowStock,
    activeOPs,
    totalSales,
    totalCustomers,
    productionMetrics,
    totalShirtsSold,
    dailySales,
    maxAmount,
    clientRankings,
    productRankings,
    calculateReplenishQty,
    getSizeDistribution
  } = useDashboardMetrics({ products, productionOrders, users, orders });

  const handleGenerateAutoOP = () => {
    if (lowStock.length === 0) {
      alert("No hay productos con stock por debajo del mínimo.");
      return;
    }

    const opItems = lowStock.map((p) => {
      const replenish = calculateReplenishQty(p);
      return {
        product: p,
        quantity: replenish,
        selectedSize: null,
        sizeDistribution: getSizeDistribution(replenish)
      };
    });

    createProductionOrder(opItems, "AUTO-AUTOSTOCK-GENERAL");
    alert(`¡OP de Autostockeo General iniciada con éxito para ${lowStock.length} modelos de camisas!`);
  };

  const handleRequestIndividualOP = (product) => {
    const replenish = calculateReplenishQty(product);
    const opItem = {
      product,
      quantity: replenish,
      selectedSize: null,
      sizeDistribution: getSizeDistribution(replenish)
    };

    createProductionOrder([opItem], `AUTO-AUTOSTOCK-${product.id}`);
    alert(`¡OP individual iniciada para "${product.name}" por ${replenish} unidades!`);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-[30px] leading-tight font-medium tracking-tight">Resumen</h1>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        <StatCard label="Ventas Totales" value={`S/ ${totalSales.toLocaleString()}`} icon={TrendingUp} color="emerald" />
        <StatCard label="Cartera Clientes" value={totalCustomers.toString()} icon={UsersIcon} color="blue" />
        <StatCard label="Órdenes Activas" value={activeOPs.length.toString()} icon={ClipboardList} color="indigo" />
        <StatCard
          label="Alertas de Stock"
          value={lowStock.length.toString()}
          icon={AlertCircle}
          trend={lowStock.length > 0 ? "Crítico" : "Ok"}
          color={lowStock.length > 0 ? "rose" : "emerald"}
        />
      </div>

      {/* Production Stages Distribution */}
      <ProductionPipelineStatus stageStats={productionMetrics.stageStats} />

      {/* Section: Sales Trend & Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <SalesMetricsChart
          totalSales={totalSales}
          totalShirtsSold={totalShirtsSold}
          dailySales={orders.length ? dailySales : []}
          maxAmount={maxAmount}
          onOpenReport={() => setShowSalesReport(true)}
        />

        {/* Top Clients Card */}
        <div className="bg-white rounded-[2px] border border-shop-line p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center gap-3 mb-4 pb-4 border-b border-shop-line">
              <div className="space-y-1">
                <h3 className="flex items-center gap-2 text-sm font-medium text-shop-ink">
                  <UserIcon size={17} strokeWidth={1.6} className="shrink-0 text-shop-blue" /> Clientes Activos
                </h3>
                <p className="text-[11px] text-shop-muted">
                  Ranking de compras reales
                </p>
              </div>
            </div>

            <div className="space-y-4 overflow-auto max-h-[190px] pr-1">
              {clientRankings.slice(0, 5).map((client, idx) => {
                const maxClientSpent = clientRankings[0]?.spent || 1;
                const pctOfMax = (client.spent / maxClientSpent) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
                        <span className="shrink-0 text-xs font-medium leading-5 text-shop-muted tabular-nums">{idx + 1}.</span>
                        <span className="min-w-0 truncate text-xs font-medium leading-5 text-shop-ink">
                          {client.name}
                        </span>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="block text-xs font-medium leading-5 text-shop-ink tabular-nums">
                          S/ {client.spent.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-shop-muted font-medium block tabular-nums leading-none">
                          {client.itemsCount} camisas
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-shop-light rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 0
                            ? "bg-shop-ink"
                            : idx === 1
                            ? "bg-shop-ink"
                            : idx === 2
                            ? "bg-shop-ink"
                            : "bg-slate-400"
                        }`}
                        style={{ width: `${pctOfMax}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-shop-line text-center">
            <span className="text-[11px] font-medium text-shop-muted tabular-nums">
              Total Clientes: {clientRankings.length} en cartera
            </span>
          </div>
        </div>
      </div>

      {/* Section: Active Production & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Production Orders Summary */}
        <div className="lg:col-span-2 bg-white rounded-[2px] border border-shop-line flex flex-col p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-shop-line pb-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-shop-ink">
              <ClipboardList size={17} strokeWidth={1.6} className="shrink-0 text-shop-blue" />
              Resumen de Producción Activa
            </h2>
            <button
              onClick={() => setShowProductionReport(true)}
              className="inline-flex min-h-9 items-center gap-2 rounded-[2px] border border-shop-line px-3 text-[11px] font-medium text-shop-ink transition-colors hover:bg-shop-light"
            >
              <ClipboardList size={14} /> Ver reporte
            </button>
          </div>
          <div className="space-y-3">
            {productionOrders.slice(0, 3).map((op, idx) => {
              const firstItem = op.items?.[0];
              const product = products.find((p) => p.id === firstItem?.productId);
              const itemCount = op.items?.length || 0;
              return (
                <div key={op._id || op.id || `op-dash-${idx}`} className="p-3 sm:p-4 bg-shop-light/40 rounded-[2px] border border-shop-line space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="w-10 h-12 shrink-0 bg-white rounded-[2px] border border-shop-line overflow-hidden group">
                        {product ? (
                          <img
                            src={product.image}
                            alt=""
                            className="w-full h-full object-cover transition-transform"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-medium text-shop-muted text-[11px]">
                            OP
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-shop-ink truncate">
                          {itemCount > 1 ? `Lote Mixto (${itemCount} modelos)` : firstItem?.productName || "Orden s/n"}
                        </div>
                        <div className="text-[11px] font-medium text-shop-muted">Iniciado: {op.startDate}</div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-medium text-shop-ink">{op.progress}%</div>
                      <div
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-[2px] ${
                          op.currentStage === "Tendido"
                            ? "bg-shop-light text-shop-blue"
                            : op.currentStage === "Corte"
                            ? "bg-shop-light text-shop-blue"
                            : op.currentStage === "Costura"
                            ? "bg-purple-100 text-purple-700"
                            : op.currentStage === "Limpieza"
                            ? "bg-pink-100 text-pink-700"
                            : op.currentStage === "Planchado y Empaquetado"
                            ? "bg-shop-light text-shop-blue"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {op.currentStage}
                      </div>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ${
                        op.currentStage === "Tendido"
                          ? "bg-shop-ink"
                          : op.currentStage === "Corte"
                          ? "bg-shop-ink"
                          : op.currentStage === "Costura"
                          ? "bg-purple-500"
                          : op.currentStage === "Limpieza"
                          ? "bg-pink-500"
                          : op.currentStage === "Planchado y Empaquetado"
                          ? "bg-shop-ink"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${op.progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Stock Alerts Kardex Sidebar */}
        <div className="bg-white rounded-[2px] border border-shop-line p-4 flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="flex items-center gap-2 text-sm font-medium text-shop-ink">
              <AlertCircle size={17} strokeWidth={1.6} className="shrink-0 text-shop-blue" />
              Alertas Kardex
            </h2>
            <span className="text-[11px] bg-red-100 text-red-700 font-medium px-2 py-0.5 rounded-full tabular-nums">
              autostock
            </span>
          </div>

          <div className="space-y-3 overflow-auto max-h-[320px] pr-1">
            {lowStock.length === 0 ? (
              <div className="text-center py-8 text-shop-muted text-sm">No hay alertas activas</div>
            ) : (
              lowStock.map((p) => {
                const minQty = calculateReplenishQty(p);
                const currentStock = p.stockPhysical - p.stockCommitted;
                return (
                  <div key={p.id} className="p-3 bg-red-50 border-l-4 border-red-500 rounded-[2px] flex flex-col space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="pr-2 min-w-0">
                        <p className="text-[11px] font-medium text-red-700 leading-none mb-1">
                          Stock Físico: {currentStock} / Mínimo: {p.minStock}
                        </p>
                        <p className="text-xs font-medium text-shop-muted truncate">{p.name}</p>
                      </div>
                      <button
                        onClick={() => handleRequestIndividualOP(p)}
                        className="text-[11px] font-medium text-red-700 hover:text-red-950 underline shrink-0 transition-colors"
                      >
                        Crear OP
                      </button>
                    </div>
                    <div className="flex flex-col space-y-1 bg-red-100/45 p-2 rounded-[2px] text-[11px]">
                      <div className="flex items-center justify-between text-shop-muted">
                        <span>Producción sugerida:</span>
                        <span className="tabular-nums font-medium text-slate-750">+{minQty} uds</span>
                      </div>
                      <div className="flex justify-between border-t border-red-200/40 pt-1 text-[11px] text-shop-muted tabular-nums">
                        {Object.entries(getSizeDistribution(minQty)).map(([sz, qty]) => (
                          <span key={sz} className="bg-white/60 px-1 rounded-[2px]">
                            <span className="font-medium text-shop-muted">{sz}:</span>{" "}
                            <span className="font-medium text-shop-muted">{qty}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={handleGenerateAutoOP}
            className="w-full py-2.5 bg-rose-600 text-white rounded-[2px] text-xs font-medium hover:bg-rose-700 transition-colors tabular-nums flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Generar OP Automática
          </button>
        </div>
      </div>

      {/* Production Report Modal */}
      <ProductionReportModal
        isOpen={showProductionReport}
        onClose={() => setShowProductionReport(false)}
        productionMetrics={productionMetrics}
        lowStock={lowStock}
        calculateReplenishQty={calculateReplenishQty}
        getSizeDistribution={getSizeDistribution}
        onGenerateAutoOP={handleGenerateAutoOP}
        onCreateIndividualOP={handleRequestIndividualOP}
      />

      {/* Sales Report Modal */}
      <SalesReportModal
        isOpen={showSalesReport}
        onClose={() => setShowSalesReport(false)}
        totalSales={totalSales}
        totalShirtsSold={totalShirtsSold}
        orders={orders}
        clientRankings={clientRankings}
        productRankings={productRankings}
      />
    </div>
  );
}

export default AdminDashboardView;

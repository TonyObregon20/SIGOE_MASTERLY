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
function StatCard({ label, value, icon: Icon, trend, color }) {
  const colorMap = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100"
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div className="space-y-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">{label}</span>
        <div className="text-2xl font-black text-slate-800 font-mono">{value}</div>
        <div className="flex items-center gap-1">
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
              trend === "Crítico" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {trend}
          </span>
        </div>
      </div>
      <div className={`p-3 rounded-xl border ${colorMap[color] || colorMap.blue}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}

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
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Ventas Totales" value={`S/ ${totalSales.toLocaleString()}`} icon={TrendingUp} trend="+8.4%" color="emerald" />
        <StatCard label="Cartera Clientes" value={totalCustomers.toString()} icon={UsersIcon} trend="Creciendo" color="blue" />
        <StatCard label="Órdenes Activas" value={activeOPs.length.toString()} icon={ClipboardList} trend="Normal" color="indigo" />
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
          dailySales={dailySales}
          maxAmount={maxAmount}
          onOpenReport={() => setShowSalesReport(true)}
        />

        {/* Top Clients Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-blue-500" /> Clientes Activos
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                  Ranking de compras reales
                </p>
              </div>
              <span className="text-[9px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono border border-blue-100">
                fidelidad
              </span>
            </div>

            <div className="space-y-4 overflow-auto max-h-[190px] pr-1">
              {clientRankings.slice(0, 5).map((client, idx) => {
                const maxClientSpent = clientRankings[0]?.spent || 1;
                const pctOfMax = (client.spent / maxClientSpent) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] font-black text-slate-400 font-mono mr-1">{idx + 1}.</span>
                        <span className="text-xs font-extrabold text-slate-700 truncate inline-block max-w-[120px]">
                          {client.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900 font-mono">
                          S/ {client.spent.toLocaleString()}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold block tracking-wider font-mono leading-none">
                          {client.itemsCount} camisas
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 0
                            ? "bg-blue-600"
                            : idx === 1
                            ? "bg-indigo-500"
                            : idx === 2
                            ? "bg-teal-500"
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

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Total Clientes: {clientRankings.length} en cartera
            </span>
          </div>
        </div>
      </div>

      {/* Section: Active Production & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Production Orders Summary */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-700">Resumen de Producción Activa</h2>
            <button
              onClick={() => setShowProductionReport(true)}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors"
            >
              <ClipboardList className="w-3.5 h-3.5" /> Ver reporte
            </button>
          </div>
          <div className="p-4 space-y-4">
            {productionOrders.slice(0, 3).map((op, idx) => {
              const firstItem = op.items?.[0];
              const product = products.find((p) => p.id === firstItem?.productId);
              const itemCount = op.items?.length || 0;
              return (
                <div key={op._id || op.id || `op-dash-${idx}`} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 bg-white rounded-lg border border-slate-200 overflow-hidden group">
                        {product ? (
                          <img
                            src={product.image}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-[10px]">
                            OP
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-800 truncate">
                          {itemCount > 1 ? `Lote Mixto (${itemCount} modelos)` : firstItem?.productName || "Orden s/n"}
                        </div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Iniciado: {op.startDate}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">{op.progress}%</div>
                      <div
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          op.currentStage === "Tendido"
                            ? "bg-blue-100 text-blue-700"
                            : op.currentStage === "Corte"
                            ? "bg-indigo-100 text-indigo-700"
                            : op.currentStage === "Costura"
                            ? "bg-purple-100 text-purple-700"
                            : op.currentStage === "Limpieza"
                            ? "bg-pink-100 text-pink-700"
                            : op.currentStage === "Planchado y Empaquetado"
                            ? "bg-teal-100 text-teal-700"
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
                          ? "bg-blue-500"
                          : op.currentStage === "Corte"
                          ? "bg-indigo-500"
                          : op.currentStage === "Costura"
                          ? "bg-purple-500"
                          : op.currentStage === "Limpieza"
                          ? "bg-pink-500"
                          : op.currentStage === "Planchado y Empaquetado"
                          ? "bg-teal-500"
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col space-y-4 border-t-4 border-t-rose-500">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-slate-700">Alertas Kardex</h2>
            <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
              autostock
            </span>
          </div>

          <div className="space-y-3 overflow-auto max-h-[320px] pr-1">
            {lowStock.length === 0 ? (
              <div className="text-center py-8 text-slate-400 italic text-sm">No hay alertas activas</div>
            ) : (
              lowStock.map((p) => {
                const minQty = calculateReplenishQty(p);
                const currentStock = p.stockPhysical - p.stockCommitted;
                return (
                  <div key={p.id} className="p-3 bg-red-50 border-l-4 border-red-500 rounded-xl flex flex-col space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="pr-2 min-w-0">
                        <p className="text-[9px] font-bold text-red-700 uppercase leading-none mb-1">
                          Stock Físico: {currentStock} / Mínimo: {p.minStock}
                        </p>
                        <p className="text-xs font-bold text-slate-700 truncate">{p.name}</p>
                      </div>
                      <button
                        onClick={() => handleRequestIndividualOP(p)}
                        className="text-[10px] font-bold text-red-700 hover:text-red-950 underline shrink-0 transition-colors"
                      >
                        Crear OP
                      </button>
                    </div>
                    <div className="flex flex-col space-y-1 bg-red-100/45 p-2 rounded-lg text-[10px]">
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Producción sugerida:</span>
                        <span className="font-mono font-bold text-slate-750">+{minQty} uds</span>
                      </div>
                      <div className="flex justify-between border-t border-red-200/40 pt-1 text-[9px] text-slate-600 font-mono">
                        {Object.entries(getSizeDistribution(minQty)).map(([sz, qty]) => (
                          <span key={sz} className="bg-white/60 px-1 rounded">
                            <span className="font-bold text-slate-400">{sz}:</span>{" "}
                            <span className="font-bold text-slate-700">{qty}</span>
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
            className="w-full py-2.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-100 uppercase tracking-wider font-mono flex items-center justify-center gap-2"
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

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp,
  X,
  User as UserIcon,
  ShoppingBag,
  FileText,
  Download
} from "lucide-react";
import { generateSalesPDF } from "../../utils/dashPdfGenerator";
import { generateSalesExcel } from "../../utils/dashExcelGenerator";

/**
 * Modal to display detailed sales, client rankings, product performance, and transaction history
 */
export default function SalesReportModal({
  isOpen,
  onClose,
  totalSales = 0,
  totalShirtsSold = 0,
  orders = [],
  clientRankings = [],
  productRankings = []
}) {
  const [salesReportTab, setSalesReportTab] = useState("overview");

  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    generateSalesPDF({
      totalSales,
      totalShirtsSold,
      clientRankings,
      productRankings,
      orders
    });
  };

  const handleDownloadExcel = () => {
    generateSalesExcel({
      totalSales,
      totalShirtsSold,
      clientRankings,
      productRankings,
      orders
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden z-[140] flex flex-col max-h-[85vh]"
        >
          {/* Modal Header */}
          <div className="bg-slate-50 border-b border-slate-200 p-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Reporte de Ventas y Clientes</h3>
                <p className="text-xs text-slate-500 font-mono">Consolidado de ingresos, compras por cliente y ventas por producto</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/50 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 overflow-x-auto">
            {[
              { id: "overview", label: "Resumen General", icon: TrendingUp },
              { id: "clients", label: "Ventas por Cliente", icon: UserIcon },
              { id: "products", label: "Ventas por Producto", icon: ShoppingBag },
              { id: "history", label: "Historial de Órdenes", icon: FileText }
            ].map((t) => {
              const Icon = t.icon;
              const active = salesReportTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSalesReportTab(t.id)}
                  className={`flex items-center gap-1.5 py-3 px-4 border-b-2 transition-all shrink-0 ${
                    active
                      ? "border-emerald-600 text-emerald-600 bg-white rounded-t-lg shadow-xs"
                      : "border-transparent hover:text-slate-850 hover:border-slate-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto flex-1 max-h-[50vh] bg-white bg-slate-50/10">
            {salesReportTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-600 block uppercase tracking-widest font-mono">
                      Ingresos Totales
                    </span>
                    <span className="text-xl font-black text-emerald-950 font-mono">S/ {totalSales.toLocaleString()}</span>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <span className="text-[10px] font-bold text-blue-600 block uppercase tracking-widest font-mono">
                      Total Camisas
                    </span>
                    <span className="text-xl font-black text-blue-955 font-mono">{totalShirtsSold} uds</span>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <span className="text-[10px] font-bold text-indigo-600 block uppercase tracking-widest font-mono">
                      Clientes Activos
                    </span>
                    <span className="text-xl font-black text-indigo-950 font-mono">{clientRankings.length}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-widest font-mono">
                      Ticket Promedio
                    </span>
                    <span className="text-xl font-black text-slate-800 font-mono">
                      S/ {orders.length > 0 ? Math.round(totalSales / orders.length).toLocaleString() : 0}
                    </span>
                  </div>
                </div>

                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono">
                    Desglose de Tipo de Venta
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800">Venta Directa</p>
                        <p className="text-[11px] text-slate-400 font-mono">Ingresos de inventario listo para llevar</p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-slate-900 font-mono">
                          S/ {orders.filter((o) => o.type === "direct").reduce((acc, o) => acc + (o.total || 0), 0).toLocaleString()}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {orders.filter((o) => o.type === "direct").length} pedidos
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800">Pedidos Personalizados</p>
                        <p className="text-[11px] text-slate-400 font-mono">Prendas con cotización y tallajes personalizados</p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-slate-900 font-mono">
                          S/ {orders.filter((o) => o.type === "pedido").reduce((acc, o) => acc + (o.total || 0), 0).toLocaleString()}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {orders.filter((o) => o.type === "pedido").length} pedidos
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {salesReportTab === "clients" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono">
                    ¿Quién nos compra más? (Ranking de Clientes)
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    Ordenado por gasto total
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono">
                      <tr>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider">Cliente</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-right">Gasto Total (S/)</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-center">N° Pedidos</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-center">Camisas Totales</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                      {clientRankings.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-sans font-bold text-slate-800 flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">{i + 1}.</span>
                            {c.name}
                          </td>
                          <td className="px-4 py-3 font-black text-slate-950 text-right">S/ {c.spent.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center text-slate-500">{c.ordersCount}</td>
                          <td className="px-4 py-3 text-center text-slate-500">{c.itemsCount} uds</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {salesReportTab === "products" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono">
                    Ventas por Línea de Producto
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    Ordenado por recaudación
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono">
                      <tr>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider">Producto</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-right">Unidades Vendidas</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-right">Recaudación Total (S/)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                      {productRankings.map((p, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-sans font-bold text-slate-800">{p.name}</td>
                          <td className="px-4 py-3 text-right text-slate-500">{p.qty} uds</td>
                          <td className="px-4 py-3 font-black text-slate-955 text-right">S/ {p.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {salesReportTab === "history" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono">
                    Historial de Transacciones
                  </h4>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono">
                      <tr>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider">ID / Fecha</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider">Cliente</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider">Tipo</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-right">Total (S/)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-slate-400 italic">
                            No hay pedidos registrados
                          </td>
                        </tr>
                      ) : (
                        orders.map((o, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">{o.id}</div>
                              <div className="text-[10px] text-slate-400">{o.date}</div>
                            </td>
                            <td className="px-4 py-3 font-sans font-medium text-slate-700">{o.customerName}</td>
                            <td className="px-4 py-3 font-sans">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  o.type === "pedido" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {o.type === "pedido" ? "A Pedido" : "Directa"}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-black text-slate-955 text-right">S/ {Number(o.total || 0).toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
              <button
                onClick={handleDownloadExcel}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl border border-emerald-700/20 shadow-sm active:scale-95 transition-all cursor-pointer font-mono"
              >
                <Download className="w-4 h-4" /> Descargar Excel
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl border border-blue-700/20 shadow-sm active:scale-95 transition-all cursor-pointer font-mono"
              >
                <FileText className="w-4 h-4" /> Descargar PDF
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-full sm:w-auto bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-xs active:scale-95 transition-transform cursor-pointer font-mono"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

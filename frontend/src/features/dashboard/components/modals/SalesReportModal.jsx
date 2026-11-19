import AdminDialog from "@/components/admin/AdminDialog";
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
      <AdminDialog label="Reporte de ventas" onClose={onClose} className="fixed inset-0 z-[130] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-shop-ink/60 backdrop-blur-xs"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-[2px] border border-shop-line w-full max-w-3xl overflow-y-auto z-[140] flex flex-col max-h-[85vh] max-h-[90dvh]"
        >
          {/* Modal Header */}
          <div className="bg-shop-light border-b border-shop-line p-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-[2px]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-shop-ink text-lg">Reporte de Ventas y Clientes</h3>
                <p className="text-xs text-shop-muted tabular-nums">Consolidado de ingresos, compras por cliente y ventas por producto</p>
              </div>
            </div>
            <button aria-label="Cerrar ventana"
              onClick={onClose}
              className="p-1.5 rounded-[2px] text-shop-muted hover:bg-slate-200 hover:text-shop-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Tabs */}
          <div className="flex border-b border-shop-line bg-shop-light/50 px-4 text-xs font-medium text-shop-muted overflow-x-auto">
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
                      ? "border-emerald-600 text-emerald-600 bg-white rounded-t-lg"
                      : "border-transparent hover:text-shop-ink hover:border-slate-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto flex-1 max-h-[50vh] bg-white bg-shop-light/10">
            {salesReportTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-[2px] border border-emerald-100">
                    <span className="text-[11px] font-medium text-emerald-600 block tabular-nums">
                      Ingresos Totales
                    </span>
                    <span className="text-xl font-semibold text-emerald-950 tabular-nums">S/ {totalSales.toLocaleString()}</span>
                  </div>
                  <div className="p-4 bg-shop-light rounded-[2px] border border-shop-light">
                    <span className="text-[11px] font-medium text-shop-blue block tabular-nums">
                      Total Camisas
                    </span>
                    <span className="text-xl font-semibold text-blue-955 tabular-nums">{totalShirtsSold} uds</span>
                  </div>
                  <div className="p-4 bg-shop-light rounded-[2px] border border-shop-light">
                    <span className="text-[11px] font-medium text-shop-blue block tabular-nums">
                      Clientes Activos
                    </span>
                    <span className="text-xl font-semibold text-indigo-950 tabular-nums">{clientRankings.length}</span>
                  </div>
                  <div className="p-4 bg-shop-light rounded-[2px] border border-shop-line">
                    <span className="text-[11px] font-medium text-shop-muted block tabular-nums">
                      Ticket Promedio
                    </span>
                    <span className="text-xl font-semibold text-shop-ink tabular-nums">
                      S/ {orders.length > 0 ? Math.round(totalSales / orders.length).toLocaleString() : 0}
                    </span>
                  </div>
                </div>

                <div className="p-4 border border-shop-line rounded-[2px] bg-shop-light/50 space-y-4">
                  <h4 className="text-xs font-semibold text-shop-muted tabular-nums">
                    Desglose de Tipo de Venta
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white border border-shop-line rounded-[2px] flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-shop-ink">Venta Directa</p>
                        <p className="text-[11px] text-shop-muted tabular-nums">Ingresos de inventario listo para llevar</p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-semibold text-shop-ink tabular-nums">
                          S/ {orders.filter((o) => o.type === "direct").reduce((acc, o) => acc + (o.total || 0), 0).toLocaleString()}
                        </p>
                        <span className="text-[11px] text-shop-muted tabular-nums">
                          {orders.filter((o) => o.type === "direct").length} pedidos
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-white border border-shop-line rounded-[2px] flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-shop-ink">Pedidos Personalizados</p>
                        <p className="text-[11px] text-shop-muted tabular-nums">Prendas con cotización y tallajes personalizados</p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-semibold text-shop-ink tabular-nums">
                          S/ {orders.filter((o) => o.type === "pedido").reduce((acc, o) => acc + (o.total || 0), 0).toLocaleString()}
                        </p>
                        <span className="text-[11px] text-shop-muted tabular-nums">
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
                  <h4 className="text-xs font-semibold text-shop-muted tabular-nums">
                    ¿Quién nos compra más? (Ranking de Clientes)
                  </h4>
                  <span className="text-[11px] font-medium text-shop-muted tabular-nums">
                    Ordenado por gasto total
                  </span>
                </div>

                <div className="border border-shop-line rounded-[2px] overflow-x-auto bg-white max-w-full">
                  <table className="w-full text-left text-xs min-w-[680px] text-[13px]">
                    <thead className="bg-shop-light border-b border-shop-line text-shop-muted tabular-nums">
                      <tr>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Cliente</th>
                        <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Gasto Total (S/)</th>
                        <th className="px-4 py-3 font-medium text-center whitespace-nowrap">N° Pedidos</th>
                        <th className="px-4 py-3 font-medium text-center whitespace-nowrap">Camisas Totales</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-shop-line tabular-nums text-shop-muted">
                      {clientRankings.map((c, i) => (
                        <tr key={i} className="hover:bg-shop-light transition-colors">
                          <td className="px-4 py-3 font-shop font-medium text-shop-ink flex items-center gap-2">
                            <span className="text-[11px] text-shop-muted tabular-nums">{i + 1}.</span>
                            {c.name}
                          </td>
                          <td className="px-4 py-3 font-semibold text-shop-ink text-right">S/ {c.spent.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center text-shop-muted">{c.ordersCount}</td>
                          <td className="px-4 py-3 text-center text-shop-muted">{c.itemsCount} uds</td>
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
                  <h4 className="text-xs font-semibold text-shop-muted tabular-nums">
                    Ventas por Línea de Producto
                  </h4>
                  <span className="text-[11px] font-medium text-shop-muted tabular-nums">
                    Ordenado por recaudación
                  </span>
                </div>

                <div className="border border-shop-line rounded-[2px] overflow-x-auto bg-white max-w-full">
                  <table className="w-full text-left text-xs min-w-[680px] text-[13px]">
                    <thead className="bg-shop-light border-b border-shop-line text-shop-muted tabular-nums">
                      <tr>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Producto</th>
                        <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Unidades Vendidas</th>
                        <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Recaudación Total (S/)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-shop-line tabular-nums text-shop-muted">
                      {productRankings.map((p, i) => (
                        <tr key={i} className="hover:bg-shop-light transition-colors">
                          <td className="px-4 py-3 font-shop font-medium text-shop-ink">{p.name}</td>
                          <td className="px-4 py-3 text-right text-shop-muted">{p.qty} uds</td>
                          <td className="px-4 py-3 font-semibold text-slate-955 text-right">S/ {p.revenue.toLocaleString()}</td>
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
                  <h4 className="text-xs font-semibold text-shop-muted tabular-nums">
                    Historial de Transacciones
                  </h4>
                </div>

                <div className="border border-shop-line rounded-[2px] overflow-x-auto bg-white max-w-full">
                  <table className="w-full text-left text-xs min-w-[680px] text-[13px]">
                    <thead className="bg-shop-light border-b border-shop-line text-shop-muted tabular-nums">
                      <tr>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">ID / Fecha</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Cliente</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Tipo</th>
                        <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Total (S/)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-shop-line tabular-nums text-shop-muted">
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-shop-muted">
                            No hay pedidos registrados
                          </td>
                        </tr>
                      ) : (
                        orders.map((o, i) => (
                          <tr key={i} className="hover:bg-shop-light transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-medium text-shop-ink">{o.id}</div>
                              <div className="text-[11px] text-shop-muted">{o.date}</div>
                            </td>
                            <td className="px-4 py-3 font-shop font-medium text-shop-muted">{o.customerName}</td>
                            <td className="px-4 py-3 font-shop">
                              <span
                                className={`px-1.5 py-0.5 rounded-[2px] text-[11px] font-medium ${
                                  o.type === "pedido" ? "bg-shop-light text-shop-blue" : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {o.type === "pedido" ? "A Pedido" : "Directa"}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-955 text-right">S/ {Number(o.total || 0).toFixed(2)}</td>
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
          <div className="bg-shop-light border-t border-shop-line p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
              <button
                onClick={handleDownloadExcel}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-shop-ink hover:bg-shop-blue text-white font-medium text-xs px-4 py-2.5 rounded-[2px] border border-emerald-700/20 transition-all cursor-pointer tabular-nums min-h-9"
              >
                <Download className="w-4 h-4" /> Descargar Excel
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-shop-ink hover:bg-shop-ink text-white font-medium text-xs px-4 py-2.5 rounded-[2px] border border-shop-line/20 transition-all cursor-pointer tabular-nums min-h-9"
              >
                <FileText className="w-4 h-4" /> Descargar PDF
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-full sm:w-auto bg-white hover:bg-shop-light text-shop-muted border border-slate-300 font-medium text-xs px-6 py-2.5 rounded-[2px] transition-transform cursor-pointer tabular-nums min-h-9"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </AdminDialog>
    </AnimatePresence>
  );
}

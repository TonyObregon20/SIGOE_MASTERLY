import React, { useState, useEffect, useMemo } from "react";
import {
  ShoppingBag,
  Package,
  Truck,
  Users as UsersIcon,
  ChevronRight,
  Plus,
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle2,
  ClipboardList,
  User as UserIcon,
  History,
  LayoutDashboard,
  Eye,
  EyeOff,
  Printer,
  Globe,
  Download,
  X,
  Edit3,
  CreditCard,
  FileText,
  UserPlus,
  Banknote,
  TrendingUp,
  Lock,
  Trash2,
  CalendarClock,
  BarChart3,
  Upload
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import StatCard from "@/components/ui/StatCard";

function SalesManagementView({
  orders = [],
  products = [],
  warehouseMovements = [],
  productionOrders = [],
  onNavigateToWarehouse,
  onNavigateToProduction,
  onUpdateOrder,
  onShipOrder
}) {
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filteredOrders = orders.filter((o) => filter === "all" || o.type === filter);

  const handleStatusChange = (orderId, newStatus) => {
    onUpdateOrder(orderId, { status: newStatus });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-col gap-4 xl:flex-row xl:items-center">
        <div className="space-y-1">
          <h1 className="text-shop-ink tracking-tight flex items-center gap-2 font-medium text-[28px]">
            <Banknote className="w-6 h-6 text-emerald-600" /> Gestión de Ventas
          </h1>
          <p className="text-xs font-medium text-shop-muted font-shop">
            Control de ingresos, pedidos personalizados y despacho coordinado con Almacén.
          </p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-[2px] border border-shop-line tabular-nums">
          <button onClick={() => setFilter("all")} className={`px-4 py-1.5 rounded-[2px] text-[11px] font-semibold transition-all ${filter === "all" ? "bg-shop-ink text-white" : "text-shop-muted hover:bg-shop-light"}`}>Todos</button>
          <button onClick={() => setFilter("direct")} className={`px-4 py-1.5 rounded-[2px] text-[11px] font-semibold transition-all ${filter === "direct" ? "bg-shop-ink text-white" : "text-shop-muted hover:bg-shop-light"}`}>Venta Directa</button>
          <button onClick={() => setFilter("pedido")} className={`px-4 py-1.5 rounded-[2px] text-[11px] font-semibold transition-all ${filter === "pedido" ? "bg-shop-ink text-white" : "text-shop-muted hover:bg-shop-light"}`}>A Pedido</button>
        </div>
      </div>

      <div className="bg-white border border-shop-line rounded-[2px] overflow-x-auto max-w-full">
        <table className="w-full text-left min-w-[680px] text-[13px]">
          <thead className="bg-shop-light border-b border-shop-line tabular-nums">
            <tr>
              <th className="px-6 py-4 text-xs font-medium text-shop-muted whitespace-nowrap">Orden / Fecha</th>
              <th className="px-6 py-4 text-xs font-medium text-shop-muted whitespace-nowrap">Cliente</th>
              <th className="px-6 py-4 text-xs font-medium text-shop-muted whitespace-nowrap">Tipo / Estado</th>
              <th className="px-6 py-4 text-xs font-medium text-shop-muted whitespace-nowrap">Total / Cobro</th>
              <th className="px-6 py-4 text-xs font-medium text-shop-muted text-right whitespace-nowrap">Estado Almacén & Despacho</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-shop-line">
            {filteredOrders.map((order, idx) => {
              const salidaMovement = (warehouseMovements || []).find(
                (wm) => wm.orderId === order.id && wm.type === "Salida"
              );
              const isSalidaAccepted = Boolean(
                order.salidaApproved ||
                order.warehouseApproved ||
                (salidaMovement && salidaMovement.status === "Aceptado")
              );
              const isSalidaPending = Boolean(
                salidaMovement && salidaMovement.status === "Pendiente"
              );
              const isShipped = order.status === "Enviado";

              const associatedOp = (productionOrders || []).find((op) => op.orderId === order.id);
              const isCustomOrder = order.type === "pedido" || Boolean(associatedOp);

              const isOpFinished = associatedOp
                ? (associatedOp.currentStage === "Finalizado" || associatedOp.progress === 100)
                : false;

              const ingresoAccepted = (warehouseMovements || []).find(
                (wm) =>
                  wm.type === "Ingreso" &&
                  wm.status === "Aceptado" &&
                  (wm.orderId === order.id || (associatedOp && wm.opId === associatedOp.id))
              );

              const ingresoPending = (warehouseMovements || []).find(
                (wm) =>
                  wm.type === "Ingreso" &&
                  wm.status === "Pendiente" &&
                  (wm.orderId === order.id || (associatedOp && wm.opId === associatedOp.id))
              );

              return (
                <tr key={order._id || order.id || `o-${idx}`} className="hover:bg-shop-light/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="tabular-nums text-xs font-semibold text-shop-ink">{order.id}</div>
                    <div className="text-[11px] font-medium text-shop-muted tracking-tight tabular-nums">{order.date}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[2px] bg-shop-light flex items-center justify-center font-semibold text-shop-muted text-[11px] border border-shop-line tabular-nums">
                        {order.customerName ? order.customerName.charAt(0) : "C"}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-shop-ink leading-none">{order.customerName}</div>
                        <div className="text-[11px] text-shop-muted font-medium mt-1 tracking-tighter">ID: {order.userId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <span className={`w-fit px-2 py-0.5 rounded-sm text-[11px] font-semibold border tabular-nums ${
                        order.type === "pedido"
                          ? "bg-shop-light text-shop-blue border-shop-line"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        {order.type === "pedido" ? "A Pedido" : "Directa"}
                      </span>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`text-[11px] font-medium border-none bg-transparent focus:ring-0 p-0 cursor-pointer tabular-nums ${
                          order.status === "Pagado Total"
                            ? "text-emerald-600"
                            : order.status === "Pagado Parcial"
                              ? "text-shop-blue"
                              : order.status === "Enviado"
                              ? "text-shop-muted"
                              : "text-amber-700"
                        }`}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Pagado Parcial">Pagado Parcial</option>
                        <option value="Pagado Total">Pagado Total</option>
                        <option value="En Producción">En Producción</option>
                        <option value="Enviado">Enviado</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-shop-ink tabular-nums tracking-tighter">S/ {(order.total || 0).toFixed(2)}</div>
                      {order.type === "pedido" && order.initialPayment && (
                        <div className="flex flex-col gap-0.5">
                          <div className="text-[11px] text-shop-muted font-medium tabular-nums">Inicial: S/ {order.initialPayment}</div>
                          <div className="flex items-center gap-1 tabular-nums">
                            <div className="h-1 w-12 bg-shop-light rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (order.initialPayment / order.total) * 100)}%` }} />
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-600">{Math.round((order.initialPayment / order.total) * 100)}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums">
                    <div className="flex items-center justify-end gap-2">
                      {isShipped ? (
                        <span className="px-3 py-1.5 bg-shop-light text-shop-muted text-[11px] font-medium rounded-[2px] flex items-center gap-1.5 border border-shop-line">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Enviado
                        </span>
                      ) : isSalidaAccepted ? (
                        <div className="flex flex-col items-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onShipOrder(order.id);
                            }}
                            className="px-3.5 py-1.5 bg-shop-ink hover:bg-shop-blue text-white text-[11px] font-semibold rounded-[2px] transition-all flex items-center gap-1.5 min-h-9"
                            title="Salida aprobada en almacén. Clic para marcar como despachado al cliente."
                          >
                            <Truck className="w-3.5 h-3.5" /> Despachar
                          </button>
                          <span className="text-[11px] font-medium text-emerald-600 tabular-nums">
                            ✓ Salida Almacén OK ({salidaMovement?.id || order.warehouseSalidaId || "Aprobada"})
                          </span>
                        </div>
                      ) : isSalidaPending ? (
                        <div className="flex flex-col items-end gap-1">
                          <button
                            disabled
                            className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium rounded-[2px] cursor-not-allowed flex items-center gap-1.5 min-h-9"
                            title="Salida registrada en almacén pero pendiente de aprobación física por el almacenero."
                          >
                            <Clock className="w-3 h-3 text-amber-600" /> Salida en Almacén ({salidaMovement.id})
                          </button>
                          {onNavigateToWarehouse && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToWarehouse();
                              }}
                              className="text-[11px] text-amber-700 hover:underline font-medium tabular-nums"
                            >
                              Ver en Almacén →
                            </button>
                          )}
                        </div>
                      ) : isCustomOrder && (!associatedOp || !isOpFinished) ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="px-3 py-1.5 bg-shop-light border border-shop-line text-shop-muted text-[11px] font-medium rounded-[2px] flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-shop-blue" />
                            {associatedOp
                              ? `En Fabricación (${associatedOp.id} • ${associatedOp.progress || 0}%)`
                              : "En Fabricación (Sin OP)"}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-shop-muted font-medium tabular-nums">En Taller • No en Almacén</span>
                            {onNavigateToProduction && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigateToProduction();
                                }}
                                className="text-[11px] text-shop-blue hover:underline font-medium tabular-nums"
                              >
                                Ver OP →
                              </button>
                            )}
                          </div>
                        </div>
                      ) : isCustomOrder && isOpFinished && !ingresoAccepted ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium rounded-[2px] flex items-center gap-1.5">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            {ingresoPending ? `Ingreso Pendiente (${ingresoPending.id})` : "Pendiente Ingreso Almacén"}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-amber-600 font-medium tabular-nums">
                              {ingresoPending ? "OP 100% • Falta Aceptar en Almacén" : "OP 100% • Falta Generar Ingreso con OP"}
                            </span>
                            {onNavigateToWarehouse && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigateToWarehouse();
                                }}
                                className="text-[11px] text-shop-blue hover:underline font-medium tabular-nums"
                              >
                                {ingresoPending ? "Aceptar Ingreso →" : "Generar Ingreso →"}
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <button
                            disabled
                            className="px-3 py-1.5 bg-shop-light border border-shop-line text-shop-blue text-[11px] font-medium rounded-[2px] cursor-not-allowed flex items-center gap-1.5 min-h-9"
                            title="Prendas disponibles en almacén. Almacén debe generar la salida para activar el despacho."
                          >
                            <Package className="w-3 h-3 text-shop-blue" /> En Almacén • Requiere Salida
                          </button>
                          {onNavigateToWarehouse && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToWarehouse();
                              }}
                              className="text-[11px] text-shop-blue hover:underline font-medium tabular-nums"
                            >
                              Generar Salida en Almacén →
                            </button>
                          )}
                        </div>
                      )}

                      <button
                        aria-label={`Ver detalle de la orden ${order.id}`}
                        aria-expanded={selectedOrder?.id === order.id}
                        onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                        className="p-2 hover:bg-white rounded-[2px] text-shop-muted hover:text-shop-blue transition-all border border-transparent hover:border-shop-line"
                      >
                        <ChevronRight className={`w-4 h-4 transition-transform ${selectedOrder?.id === order.id ? "rotate-90" : ""}`} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredOrders.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-16 text-center text-sm text-shop-muted">No hay ventas en esta selección.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-shop-line rounded-[2px] p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-shop-muted">Detalle de Productos</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => {
                    const product = products.find((p) => p.id === item.productId);
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-shop-light rounded-[2px] border border-shop-line">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 bg-white rounded-[2px] border border-shop-line overflow-hidden">
                            {product ? (
                              <img src={product.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full bg-shop-light" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-shop-ink">{product?.name || `REF: ${item.productId}`}</p>
                            <p className="text-[11px] text-shop-muted font-medium">Cant: {item.quantity} x S/ {item.price}</p>
                            {item.selectedSize && (
                              <span className="inline-block mt-1 text-[11px] font-semibold bg-shop-light text-shop-blue px-1.5 py-0.5 rounded-[2px] border border-blue-150">
                                Talla: {item.selectedSize}
                              </span>
                            )}
                            {item.sizeDistribution && (
                              <div className="flex flex-wrap gap-1 mt-1 tabular-nums">
                                {Object.entries(item.sizeDistribution).map(([sz, quantity]) => quantity > 0 && (
                                  <span key={sz} className="text-[11px] font-medium bg-shop-light border border-shop-line px-1 py-0.5 rounded-[2px] text-slate-605">
                                    Talla {sz}: {quantity}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-shop-ink tabular-nums">S/ {(item.quantity * item.price).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedOrder.type === "pedido" && selectedOrder.installments && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-shop-blue flex items-center gap-2">
                    <CalendarClock className="w-4 h-4" /> Plan de Cuotas
                  </h3>
                  <div className="space-y-3 tabular-nums">
                    {selectedOrder.installments.map((inst, idx) => (
                      <div key={idx} className="p-3 border border-shop-light bg-shop-light/30 rounded-[2px] flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-semibold text-blue-900">Cuota {idx + 1} de {inst.total}</p>
                          <p className="text-[11px] text-shop-blue font-medium">Vence: {inst.dueDate}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-blue-950">S/ {inst.amount}</p>
                          <span className="text-[11px] font-semibold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-shop font-medium">Pendiente</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SalesManagementView;

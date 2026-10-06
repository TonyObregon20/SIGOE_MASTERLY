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
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Banknote className="w-6 h-6 text-emerald-600" /> Gestión de Ventas
          </h2>
          <p className="text-xs font-medium text-slate-500 italic font-serif">
            Control de ingresos, pedidos personalizados y despacho coordinado con Almacén.
          </p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm font-mono">
          <button onClick={() => setFilter("all")} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === "all" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}>Todos</button>
          <button onClick={() => setFilter("direct")} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === "direct" ? "bg-emerald-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>Venta Directa</button>
          <button onClick={() => setFilter("pedido")} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === "pedido" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>A Pedido</button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 font-mono">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Orden / Fecha</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cliente</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tipo / Estado</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total / Cobro</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Estado Almacén & Despacho</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
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
                <tr key={order._id || order.id || `o-${idx}`} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs font-black text-slate-900">{order.id}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight font-mono">{order.date}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-400 text-[10px] border border-slate-200 uppercase font-mono">
                        {order.customerName ? order.customerName.charAt(0) : "C"}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800 leading-none">{order.customerName}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">ID: {order.userId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <span className={`w-fit px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest border font-mono ${
                        order.type === "pedido" 
                          ? "bg-blue-50 text-blue-700 border-blue-200" 
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        {order.type === "pedido" ? "A Pedido" : "Directa"}
                      </span>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`text-[10px] font-bold border-none bg-transparent focus:ring-0 p-0 cursor-pointer font-mono ${
                          order.status === "Pagado Total" 
                            ? "text-emerald-600" 
                            : order.status === "Pagado Parcial" 
                              ? "text-blue-600" 
                              : order.status === "Enviado"
                              ? "text-slate-600"
                              : "text-amber-650"
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
                      <div className="text-sm font-black text-slate-950 font-mono tracking-tighter">S/ {(order.total || 0).toFixed(2)}</div>
                      {order.type === "pedido" && order.initialPayment && (
                        <div className="flex flex-col gap-0.5">
                          <div className="text-[9px] text-slate-400 font-bold uppercase font-mono">Inicial: S/ {order.initialPayment}</div>
                          <div className="flex items-center gap-1 font-mono">
                            <div className="h-1 w-12 bg-slate-105 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (order.initialPayment / order.total) * 100)}%` }} />
                            </div>
                            <span className="text-[8px] font-black text-emerald-600">{Math.round((order.initialPayment / order.total) * 100)}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono">
                    <div className="flex items-center justify-end gap-2">
                      {isShipped ? (
                        <span className="px-3 py-1.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg flex items-center gap-1.5 border border-slate-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Enviado
                        </span>
                      ) : isSalidaAccepted ? (
                        <div className="flex flex-col items-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onShipOrder(order.id);
                            }}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-1.5"
                            title="Salida aprobada en almacén. Clic para marcar como despachado al cliente."
                          >
                            <Truck className="w-3.5 h-3.5 animate-pulse" /> Despachar
                          </button>
                          <span className="text-[8px] font-bold text-emerald-600 font-mono">
                            ✓ Salida Almacén OK ({salidaMovement?.id || order.warehouseSalidaId || "Aprobada"})
                          </span>
                        </div>
                      ) : isSalidaPending ? (
                        <div className="flex flex-col items-end gap-1">
                          <button
                            disabled
                            className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-not-allowed flex items-center gap-1.5"
                            title="Salida registrada en almacén pero pendiente de aprobación física por el almacenero."
                          >
                            <Clock className="w-3 h-3 text-amber-600 animate-spin" /> Salida en Almacén ({salidaMovement.id})
                          </button>
                          {onNavigateToWarehouse && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToWarehouse();
                              }}
                              className="text-[9px] text-amber-700 hover:underline font-bold font-mono"
                            >
                              Ver en Almacén →
                            </button>
                          )}
                        </div>
                      ) : isCustomOrder && (!associatedOp || !isOpFinished) ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-blue-500" />
                            {associatedOp 
                              ? `En Fabricación (${associatedOp.id} • ${associatedOp.progress || 0}%)` 
                              : "En Fabricación (Sin OP)"}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] text-slate-400 font-bold font-mono">En Taller • No en Almacén</span>
                            {onNavigateToProduction && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigateToProduction();
                                }}
                                className="text-[9px] text-blue-600 hover:underline font-bold font-mono"
                              >
                                Ver OP →
                              </button>
                            )}
                          </div>
                        </div>
                      ) : isCustomOrder && isOpFinished && !ingresoAccepted ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            {ingresoPending ? `Ingreso Pendiente (${ingresoPending.id})` : "Pendiente Ingreso Almacén"}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] text-amber-600 font-bold font-mono">
                              {ingresoPending ? "OP 100% • Falta Aceptar en Almacén" : "OP 100% • Falta Generar Ingreso con OP"}
                            </span>
                            {onNavigateToWarehouse && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigateToWarehouse();
                                }}
                                className="text-[9px] text-blue-600 hover:underline font-bold font-mono"
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
                            className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-not-allowed flex items-center gap-1.5"
                            title="Prendas disponibles en almacén. Almacén debe generar la salida para activar el despacho."
                          >
                            <Package className="w-3 h-3 text-blue-600" /> En Almacén • Requiere Salida
                          </button>
                          {onNavigateToWarehouse && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToWarehouse();
                              }}
                              className="text-[9px] text-blue-600 hover:underline font-bold font-mono"
                            >
                              Generar Salida en Almacén →
                            </button>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                        className="p-2 hover:bg-white hover:shadow-md rounded-lg text-slate-400 hover:text-blue-600 transition-all border border-transparent hover:border-slate-100"
                      >
                        <ChevronRight className={`w-4 h-4 transition-transform ${selectedOrder?.id === order.id ? "rotate-90" : ""}`} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sms font-black uppercase tracking-widest text-slate-400">Detalle de Productos</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => {
                    const product = products.find((p) => p.id === item.productId);
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 bg-white rounded border border-slate-200 overflow-hidden">
                            {product ? (
                              <img src={product.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full bg-slate-100" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{product?.name || `REF: ${item.productId}`}</p>
                            <p className="text-[10px] text-slate-500 font-medium">Cant: {item.quantity} x S/ {item.price}</p>
                            {item.selectedSize && (
                              <span className="inline-block mt-1 text-[8px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-150">
                                Talla: {item.selectedSize}
                              </span>
                            )}
                            {item.sizeDistribution && (
                              <div className="flex flex-wrap gap-1 mt-1 font-mono">
                                {Object.entries(item.sizeDistribution).map(([sz, quantity]) => quantity > 0 && (
                                  <span key={sz} className="text-[8px] font-bold bg-slate-105 border border-slate-200 px-1 py-0.5 rounded text-slate-605">
                                    Talla {sz}: {quantity}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-black text-slate-900 font-mono">S/ {(item.quantity * item.price).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedOrder.type === "pedido" && selectedOrder.installments && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                    <CalendarClock className="w-4 h-4" /> Plan de Cuotas
                  </h3>
                  <div className="space-y-3 font-mono">
                    {selectedOrder.installments.map((inst, idx) => (
                      <div key={idx} className="p-3 border border-blue-100 bg-blue-50/30 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black text-blue-900 uppercase">Cuota {idx + 1} de {inst.total}</p>
                          <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Vence: {inst.dueDate}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-blue-950">S/ {inst.amount}</p>
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-serif font-bold">Pendiente</span>
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

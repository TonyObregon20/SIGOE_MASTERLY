import React, { useState, useEffect } from "react";
import {
  Package,
  Truck,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  Download,
  Banknote,
  CalendarClock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AdminDialog from "@/components/admin/AdminDialog";
import { Pagination } from "@/components/shop/ShopUI";
import { formatOrderId } from "@/features/orders/ordersUtils";
import { generateSalidaGuidePDF } from "@/utils/pdfGenerator";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [shippingOrderId, setShippingOrderId] = useState(null);
  const [dispatchNotice, setDispatchNotice] = useState(null);

  const filteredOrders = orders.filter((o) => filter === "all" || o.type === filter);
  const pagedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [filteredOrders.length, pageSize, currentPage]);

  const handleDispatch = async (order, guide) => {
    if (shippingOrderId) return;
    if (!guide || guide.status !== "Aceptado") {
      setDispatchNotice({
        orderId: order.id,
        needsWarehouse: true,
        message: guide
          ? "Primero debes aprobar la salida en Almacén y Kardex."
          : "Primero debes generar una salida (guía) con transportista en Almacén y Kardex."
      });
      return;
    }

    setShippingOrderId(order.id);
    try {
      const result = await onShipOrder(order.id);
      if (!result?.success) {
        setDispatchNotice({
          orderId: order.id,
          needsWarehouse: ["GUIDE_REQUIRED", "GUIDE_PENDING"].includes(result?.code),
          message: result?.message || "No se pudo despachar el pedido."
        });
      }
    } catch (error) {
      setDispatchNotice({ orderId: order.id, message: error.message || "No se pudo despachar el pedido." });
    } finally {
      setShippingOrderId(null);
    }
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
        <div className="grid w-full grid-cols-3 gap-1 bg-white p-1 rounded-[2px] border border-shop-line tabular-nums sm:w-auto">
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
              <th scope="col" className="whitespace-nowrap px-6 py-4 text-center text-xs font-semibold text-shop-ink">Guía</th>
              <th className="px-6 py-4 text-xs font-medium text-shop-muted text-right whitespace-nowrap">Estado Almacén & Despacho</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-shop-line">
            {pagedOrders.map((order, idx) => {
              const salidaMovement = (warehouseMovements || []).find(
                (wm) => wm.orderId === order.id && wm.type === "Salida" && wm.status !== "Rechazado"
              );
              const guide = warehouseMovements.find(
                (wm) => wm.orderId === order.id && wm.type === "Salida" &&
                  (wm.status === "Aceptado" || wm.status === "Pendiente") &&
                  wm.guideNumber && wm.carrier?.trim()
              );
              const isSalidaAccepted = guide?.status === "Aceptado";
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
                    <div
                      className="max-w-[180px] truncate tabular-nums text-xs font-semibold text-shop-ink"
                      title={order.id}
                    >
                      {formatOrderId(order.id)}
                    </div>
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
                        disabled={isShipped || shippingOrderId === order.id}
                        onChange={(e) => {
                          const status = e.target.value;
                          if (status === "Enviado") handleDispatch(order, guide);
                          else onUpdateOrder(order.id, { status });
                        }}
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
                  <td className="px-6 py-4 text-center">
                    {guide ? (
                      <div className="inline-flex items-center gap-2 whitespace-nowrap align-middle">
                        <span className="rounded-[2px] bg-shop-light px-2.5 py-1 text-xs font-semibold tabular-nums text-shop-ink">
                          {guide.guideNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => generateSalidaGuidePDF(guide)}
                          aria-label={`Descargar guía ${guide.guideNumber} en PDF`}
                          title="Descargar PDF"
                          className="inline-flex size-9 shrink-0 items-center justify-center rounded-[2px] border border-shop-line bg-white text-shop-blue transition-colors hover:border-shop-blue hover:bg-shop-light focus-visible:outline-2 focus-visible:outline-shop-blue focus-visible:outline-offset-2"
                        >
                          <Download className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    ) : <span className="whitespace-nowrap text-xs text-shop-muted">Sin guía</span>}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums">
                    <div className="flex items-center justify-end gap-2">
                      {isShipped ? (
                        <span className="px-3 py-1.5 bg-shop-light text-shop-muted text-[11px] font-medium rounded-[2px] flex items-center gap-1.5 border border-shop-line">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Enviado
                        </span>
                      ) : (
                        <div className="flex flex-col items-end gap-2">
                          <button
                            type="button"
                            disabled={Boolean(shippingOrderId)}
                            onClick={() => handleDispatch(order, guide)}
                            className="px-3.5 py-1.5 bg-shop-ink hover:bg-shop-blue text-white text-[11px] font-semibold rounded-[2px] flex items-center gap-1.5 min-h-9 disabled:opacity-50"
                          >
                            <Truck className="w-3.5 h-3.5" /> {shippingOrderId === order.id ? "Despachando…" : "Despachar"}
                          </button>
                          {isSalidaAccepted ? (
                            <span className="text-[11px] font-medium text-emerald-600">Salida aprobada</span>
                          ) : guide?.status === "Pendiente" ? (
                            <span className="text-[11px] font-medium text-amber-700">Salida pendiente de aprobación</span>
                          ) : salidaMovement?.status === "Aceptado" ? (
                            <span className="text-[11px] font-medium text-amber-700">Salida aprobada · Falta guía</span>
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
                                <span className="text-[11px] font-medium text-shop-blue flex items-center gap-1.5">
                                  <Package className="w-3 h-3 text-shop-blue" /> En Almacén • Requiere Salida
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
                                    Generar Salida en Almacén →
                                  </button>
                          )}
                        </div>
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
              <tr><td colSpan={6} className="px-6 py-16 text-center text-sm text-shop-muted">No hay ventas en esta selección.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {filteredOrders.length > 0 && (
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredOrders.length}
          itemLabel="ventas"
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}

      {dispatchNotice && (
        <AdminDialog
          label="Despacho pendiente"
          onClose={() => setDispatchNotice(null)}
          className="fixed inset-0 z-[120] grid place-items-center bg-shop-ink/60 p-4"
        >
          <div className="w-full max-w-md space-y-4 rounded-[2px] border border-shop-line bg-white p-6">
            <h2 className="text-lg font-semibold">Despacho pendiente · {formatOrderId(dispatchNotice.orderId)}</h2>
            <p className="text-shop-muted">{dispatchNotice.message}</p>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setDispatchNotice(null)} className="rounded-[2px] border border-shop-line px-4 py-2">
                Cerrar
              </button>
              {dispatchNotice.needsWarehouse && onNavigateToWarehouse && (
                <button type="button" onClick={() => {
                  setDispatchNotice(null);
                  onNavigateToWarehouse();
                }} className="rounded-[2px] bg-shop-ink px-4 py-2 text-white">
                  Ir a Almacén y Kardex
                </button>
              )}
            </div>
          </div>
        </AdminDialog>
      )}

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

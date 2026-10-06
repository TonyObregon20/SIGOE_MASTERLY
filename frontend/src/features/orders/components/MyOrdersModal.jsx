import React, { useState, useEffect } from "react";
import { 
  X, 
  FileText, 
  Download, 
  Mail, 
  CheckCircle2, 
  Clock, 
  ShoppingBag, 
  Send,
  Calendar,
  PackageCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateInvoicePDF } from "@/utils/pdfGenerator";
import { sendInvoiceEmailApi } from "@/features/invoices/invoicesApi";

function MyOrdersModal({ isOpen, onClose, orders = [], invoices = [], currentUser, onRefresh }) {
  const [sentEmailStatus, setSentEmailStatus] = useState({}); // { [orderId]: email }
  const [sendingOrderId, setSendingOrderId] = useState(null);

  useEffect(() => {
    if (isOpen && typeof onRefresh === "function") {
      onRefresh();
    }
  }, [isOpen, onRefresh]);

  if (!isOpen) return null;

  // Filter orders for the current user
  const userOrders = orders.filter(
    (o) => o.userId === currentUser?.id || o.customerName === currentUser?.name
  );

  const handleDownloadInvoice = (order) => {
    // Find matching invoice
    const inv = invoices.find((i) => i.orderId === order.id) || {};
    generateInvoicePDF({
      docType: inv.type || "Boleta",
      series: inv.series || (inv.type === "Factura" ? "F001" : "B001"),
      invoiceNumber: inv.number || "000001",
      orderId: order.id,
      customerName: order.customerName || currentUser?.name || "Cliente",
      docNumber: inv.customerDoc || "00000000",
      items: order.items || [],
      total: order.total || 0,
      date: order.date || new Date().toISOString().split("T")[0],
      type: order.type || "direct",
      initialPayment: order.initialPayment
    });
  };

  const handleSendEmail = async (order) => {
    const inv = invoices.find((i) => i.orderId === order.id) || {};
    const emailTo = currentUser?.email || "cliente@ejemplo.com";
    setSendingOrderId(order.id);

    try {
      await sendInvoiceEmailApi({
        email: emailTo,
        orderId: order.id,
        docType: inv.type || "Boleta",
        fullInvoiceCode: `${inv.series || 'B001'}-${inv.number || '000001'}`,
        customerName: order.customerName || currentUser?.name || "Cliente",
        total: order.total
      });
      setSentEmailStatus((prev) => ({ ...prev, [order.id]: emailTo }));
    } catch (err) {
      console.error(err);
      setSentEmailStatus((prev) => ({ ...prev, [order.id]: emailTo }));
    } finally {
      setSendingOrderId(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 z-10 max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-xl text-white">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-sans">Mis Pedidos y Comprobantes</h3>
                <p className="text-xs text-slate-400 font-serif">Historial de compras y descarga de boletas/facturas en PDF</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Orders List */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {userOrders.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="text-base font-bold text-slate-700">Aún no tienes pedidos registrados</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Cuando realices una compra en la tienda o una solicitud "A Pedido", aparecerán aquí con sus respectivas boletas y facturas.
                </p>
              </div>
            ) : (
              userOrders.map((ord) => {
                const inv = invoices.find((i) => i.orderId === ord.id);
                const docLabel = inv ? `${inv.type} ${inv.series}-${inv.number}` : "Comprobante emitido";
                const isSent = Boolean(sentEmailStatus[ord.id]);

                return (
                  <div key={ord._id || ord.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 hover:border-slate-300 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-slate-900 text-white font-mono font-bold text-xs rounded-lg">
                          {ord.id}
                        </span>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full font-mono ${
                          ord.type === "pedido" ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}>
                          {ord.type === "pedido" ? "A Pedido (Manufactura)" : "Venta Directa"}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 font-mono flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ord.date}</span>
                      </div>
                    </div>

                    {/* Order items */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Prendas Adquiridas:</span>
                        <div className="space-y-1 mt-1">
                          {ord.items?.map((it, idx) => (
                            <div key={idx} className="text-slate-700 font-medium">
                              • {it.quantity}x {it.productName || "Camisa Masterly"} {it.selectedSize ? `(Talla ${it.selectedSize})` : ""}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
                        <div className="flex justify-between text-slate-600">
                          <span>Total Comprobante:</span>
                          <strong className="text-slate-900 font-mono text-sm">S/ {ord.total?.toFixed(2)}</strong>
                        </div>
                        {ord.type === "pedido" && ord.initialPayment && (
                          <div className="flex justify-between text-emerald-700 text-[11px]">
                            <span>Adelanto 50%:</span>
                            <strong className="font-mono">S/ {ord.initialPayment.toFixed(2)}</strong>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 pt-1 font-mono">
                          {docLabel}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons: Download PDF & Send Email */}
                    <div className="pt-2 flex flex-wrap gap-2 justify-end border-t border-slate-200">
                      <button
                        onClick={() => handleSendEmail(ord)}
                        disabled={sendingOrderId === ord.id}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 font-mono uppercase ${
                          isSent 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {isSent ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Enviado a Correo</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            <span>{sendingOrderId === ord.id ? "Enviando..." : "Enviar a mi Correo"}</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDownloadInvoice(ord)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 font-mono uppercase shadow-sm shadow-blue-200"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar PDF</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default MyOrdersModal;

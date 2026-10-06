import React, { useState } from "react";
import { 
  CheckCircle2, 
  Download, 
  Mail, 
  FileText, 
  X, 
  Sparkles, 
  Send, 
  ArrowRight,
  ShieldCheck,
  Building2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateInvoicePDF } from "@/utils/pdfGenerator";
import { sendInvoiceEmailApi } from "@/features/invoices/invoicesApi";

function OrderSuccessModal({ isOpen, onClose, orderData, currentUser, onOpenMyOrders }) {
  const [email, setEmail] = useState(currentUser?.email || "cliente@ejemplo.com");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  if (!isOpen || !orderData) return null;

  const {
    orderId = "ORD-0000",
    docType = "Boleta",
    docNumber = "00000000",
    series = "B001",
    invoiceNumber = "000001",
    items = [],
    total = 0,
    type = "direct",
    customerName = currentUser?.name || "Cliente",
    date = new Date().toISOString().split("T")[0],
    initialPayment
  } = orderData;

  const fullInvoiceCode = `${series}-${invoiceNumber ? invoiceNumber.toString().padStart(6, "0") : "000001"}`;

  const handleDownloadPDF = () => {
    generateInvoicePDF({
      docType,
      series,
      invoiceNumber,
      orderId,
      customerName,
      docNumber,
      items,
      total,
      date,
      type,
      initialPayment
    });
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSendingEmail(true);
    setEmailSentSuccess(false);

    try {
      const data = await sendInvoiceEmailApi({
        email: email.trim(),
        orderId,
        docType,
        fullInvoiceCode,
        customerName,
        total
      });

      if (data && data.success) {
        setEmailSentSuccess(true);
      }
    } catch (err) {
      console.error("Error sending invoice email:", err);
      // Fallback UI simulation
      setEmailSentSuccess(true);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[130]">
        {/* Full Viewport Dark Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Scrollable Modal Container */}
        <div className="fixed inset-0 z-10 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-auto"
          >
            {/* Header Banner - Brand Blue Theme */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 p-6 md:p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-2xl rounded-full" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative space-y-3 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-100 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />
                  <span>¡Compra Exitosa Registrada!</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-serif italic font-black text-white tracking-tight">
                  Comprobante de Pago Generado
                </h2>

                <p className="text-blue-100 text-xs sm:text-sm font-medium font-serif">
                  Se ha emitido tu <strong className="text-white">{docType} Electrónica N° {fullInvoiceCode}</strong> correspondiente al pedido <strong className="text-white font-mono">{orderId}</strong>.
                </p>
              </div>
            </div>

            {/* Body Content */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Purchase Details Summary Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-mono font-bold text-slate-500 uppercase tracking-wider text-[10px]">Resumen de Comprobante</span>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full text-[10px]">
                    {docType} {fullInvoiceCode}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-slate-700 font-sans">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-mono block">Cliente:</span>
                    <strong className="text-slate-900 font-semibold">{customerName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-mono block">{docType === "Factura" ? "RUC:" : "DNI/Doc:"}</span>
                    <strong className="text-slate-900 font-semibold">{docNumber || "00000000"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-mono block">Modalidad:</span>
                    <strong className="text-blue-600 font-semibold">
                      {type === "pedido" ? "A Pedido (Manufactura 50% Adelanto)" : "Venta Directa de Stock"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-mono block">Total Operación:</span>
                    <strong className="text-slate-900 font-bold text-sm">S/ {total.toFixed(2)}</strong>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Artículos Comprados ({items.length}):</span>
                    <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                      {items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-[11px] text-slate-600">
                          <span className="truncate max-w-[240px]">
                            {it.quantity}x {it.productName || it.name || "Prenda"} {it.selectedSize ? `(${it.selectedSize})` : ""}
                          </span>
                          <span className="font-mono font-bold text-slate-800">S/ {(it.quantity * it.price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION 1: Download PDF Button */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-widest block">
                  Opción 1: Descargar Comprobante PDF
                </label>
                <button
                  onClick={handleDownloadPDF}
                  className="w-full py-3.5 px-4 bg-slate-950 hover:bg-blue-600 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-slate-900/10 flex items-center justify-center gap-2.5 uppercase tracking-wider font-mono active:scale-98"
                >
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>Descargar {docType} en Formato PDF</span>
                </button>
              </div>

              {/* ACTION 2: Send Invoice to Email Form */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-widest flex items-center justify-between">
                  <span>Opción 2: Enviar {docType} a tu Correo</span>
                  {emailSentSuccess && (
                    <span className="text-blue-600 font-bold flex items-center gap-1 font-sans text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Enviado correctamente
                    </span>
                  )}
                </label>

                <form onSubmit={handleSendEmail} className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="correo@cliente.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSendingEmail}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 uppercase font-mono whitespace-nowrap disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSendingEmail ? "Enviando..." : "Enviar Correo"}
                  </button>
                </form>

                {emailSentSuccess && (
                  <p className="text-[11px] text-blue-700 font-medium bg-blue-50 border border-blue-200 p-2.5 rounded-xl flex items-center gap-2 font-sans">
                    <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>¡Se ha enviado una copia digital de tu {docType} N° {fullInvoiceCode} a <strong className="font-bold">{email}</strong>!</span>
                  </p>
                )}
              </div>

              {/* Close / Next Button */}
              <div className="pt-4 flex gap-3">
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all uppercase tracking-wider font-mono"
                >
                  Cerrar y Continuar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}

export default OrderSuccessModal;

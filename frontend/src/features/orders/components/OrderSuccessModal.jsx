import { ShopModal } from "@/components/shop/ShopUI";
import React, { useState } from "react";
import { CheckCircle2, Download, Mail, FileText, X, Sparkles, Send, ArrowRight, ShieldCheck, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateInvoicePDF, generateInvoicePDFBase64 } from "@/utils/pdfGenerator";
import { sendInvoiceEmailApi } from "@/features/invoices/invoicesApi";
function OrderSuccessModal({
  isOpen,
  onClose,
  orderData,
  currentUser,
  onOpenMyOrders
}) {
  const [emailOverride, setEmail] = useState(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");
  const email = emailOverride ?? orderData?.customerEmail ?? currentUser?.email ?? "";

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
    setEmailError("");

    try {
      const pdf = await generateInvoicePDFBase64({
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
      const data = await sendInvoiceEmailApi({
        email: email.trim(),
        orderId,
        pdfBase64: pdf.base64,
        pdfFileName: pdf.fileName,
        docType,
        fullInvoiceCode,
        customerName,
        total
      });

      if (data && data.success) {
        setEmailSentSuccess(true);
      } else {
        throw new Error(data?.message || "No se pudo enviar el comprobante.");
      }
    } catch (err) {
      console.error("Error sending invoice email:", err);
      setEmailError(err.message || "No se pudo enviar el comprobante.");
    } finally {
      setIsSendingEmail(false);
    }
  };
  return <ShopModal title="Tu pedido está confirmado." eyebrow={"Pedido " + orderId} onClose={onClose}><p className="border-b border-shop-line px-6 py-4 text-xs text-shop-muted">{docType} {fullInvoiceCode}</p><div className="p-6 md:p-8 space-y-6">
              {/* Purchase Details Summary Box */}
              <div className="bg-shop-light border border-shop-line rounded-none p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-shop-line">
                  <span className="font-shop font-medium text-shop-muted tracking-wider text-[11px]">Resumen de Comprobante</span>
                  <span className="font-shop font-medium text-shop-blue bg-shop-light border border-shop-line px-2.5 py-0.5 rounded-full text-[11px]">
                    {docType} {fullInvoiceCode}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-slate-700 font-shop">
                  <div>
                    <span className="text-shop-muted text-[11px] font-shop block">Cliente:</span>
                    <strong className="text-shop-ink font-semibold">{customerName}</strong>
                  </div>
                  <div>
                    <span className="text-shop-muted text-[11px] font-shop block">{docType === "Factura" ? "RUC:" : "DNI/Doc:"}</span>
                    <strong className="text-shop-ink font-semibold">{docNumber || "00000000"}</strong>
                  </div>
                  <div>
                    <span className="text-shop-muted text-[11px] font-shop block">Modalidad:</span>
                    <strong className="text-shop-blue font-semibold">
                      {type === "pedido" ? "A Pedido (Manufactura 50% Adelanto)" : "Venta Directa de Stock"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-shop-muted text-[11px] font-shop block">Total Operación:</span>
                    <strong className="text-shop-ink font-medium text-sm">S/ {total.toFixed(2)}</strong>
                  </div>
                </div>

                {items.length > 0 && <div className="pt-2 border-t border-shop-line space-y-1">
                    <span className="text-[11px] font-shop font-medium text-shop-muted">Artículos Comprados ({items.length}):</span>
                    <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                      {items.map((it, idx) => <div key={idx} className="flex justify-between text-[11px] text-shop-muted">
                          <span className="truncate max-w-[240px]">
                            {it.quantity}x {it.productName || it.name || "Prenda"} {it.selectedSize ? `(${it.selectedSize})` : ""}
                          </span>
                          <span className="font-shop font-medium text-shop-ink">S/ {(it.quantity * it.price).toFixed(2)}</span>
                        </div>)}
                    </div>
                  </div>}
              </div>

              {/* ACTION 1: Download PDF Button */}
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-shop-muted font-shop block">
                  Opción 1: Descargar Comprobante PDF
                </label>
                <button onClick={handleDownloadPDF} className="w-full py-3.5 px-4 bg-shop-ink hover:bg-shop-blue text-white rounded-none text-xs font-medium transition-all flex items-center justify-center gap-2.5 tracking-wider font-shop active:scale-98">
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>Descargar {docType} en Formato PDF</span>
                </button>
              </div>

              {/* ACTION 2: Send Invoice to Email Form */}
              <div className="space-y-2 pt-2 border-t border-shop-line">
                <label className="text-[11px] font-medium text-shop-muted font-shop flex items-center justify-between">
                  <span>Opción 2: Enviar {docType} a tu Correo</span>
                  {emailSentSuccess && <span className="text-shop-blue font-medium flex items-center gap-1 font-shop text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Enviado correctamente
                    </span>}
                </label>

                <form onSubmit={handleSendEmail} className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-shop-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="email" required placeholder="correo@cliente.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-shop-light border border-shop-line rounded-none text-xs font-semibold text-shop-ink focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white" />
                  </div>
                  <button type="submit" disabled={isSendingEmail} className="px-4 py-2.5 bg-shop-blue hover:bg-shop-blue text-white rounded-none text-xs font-medium transition-all flex items-center gap-1.5 font-shop whitespace-nowrap disabled:opacity-50">
                    <Send className="w-3.5 h-3.5" />
                    {isSendingEmail ? "Enviando..." : "Enviar Correo"}
                  </button>
                </form>

                {emailError && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-xs text-red-700">{emailError}</p>}
                {emailSentSuccess && <p className="text-[11px] text-shop-blue font-medium bg-shop-light border border-shop-line p-2.5 rounded-none flex items-center gap-2 font-shop">
                    <Sparkles className="w-4 h-4 text-shop-blue flex-shrink-0" />
                    <span>¡Se ha enviado una copia digital de tu {docType} N° {fullInvoiceCode} a <strong className="font-medium">{email}</strong>!</span>
                  </p>}
              </div>

              {/* Close / Next Button */}
              <div className="pt-4 flex gap-3">
                <button onClick={onClose} className="w-full py-3 bg-shop-light hover:bg-slate-200 text-slate-700 rounded-none text-xs font-medium transition-all tracking-wider font-shop">
                  Cerrar y Continuar
                </button>
              </div>
            </div></ShopModal>;
}
export default OrderSuccessModal;

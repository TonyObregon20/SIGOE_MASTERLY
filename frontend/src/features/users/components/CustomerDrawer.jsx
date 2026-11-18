import InvoiceEmailModal from "@/features/invoices/components/InvoiceEmailModal";
import { ShopModal } from "@/components/shop/ShopUI";
import React, { useMemo, useState } from "react";
import { ArrowRight, BarChart3, Check, CreditCard, Download, FileText, LogOut, Mail, Package, ShoppingBag, Store, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { generateInvoicePDF, generateInvoicePDFBase64 } from "@/utils/pdfGenerator";
import { sendInvoiceEmailApi } from "@/features/invoices/invoicesApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
const STAGES = ["Tendido", "Corte", "Costura", "Limpieza", "Planchado y Empaquetado"];
function CustomerDrawer({
  isOpen,
  onClose,
  currentUser,
  orders = [],
  invoices = [],
  productionOrders = [],
  onSetView,
  onLogout
}) {
  const [activeTab, setActiveTab] = useState("summary");
  const [sentInvoices, setSentInvoices] = useState({});
  const [emailInvoice, setEmailInvoice] = useState(null);
  const {
    logout
  } = useAuth();
  const userOrders = useMemo(() => orders.filter(order => order.userId === currentUser?.id || order.customerName === currentUser?.name), [orders, currentUser]);
  const userInvoices = useMemo(() => invoices.filter(invoice => userOrders.some(order => order.id === invoice.orderId)), [invoices, userOrders]);
  const totalInvested = userOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const creditLimit = Number(currentUser?.creditLimit || 0);
  const creditUsed = userOrders.filter(order => order.type === "pedido").reduce((sum, order) => sum + Number(order.total || 0), 0);
  const creditAvailable = Math.max(creditLimit - creditUsed, 0);
  const creditPercent = creditLimit ? Math.min(creditUsed / creditLimit * 100, 100) : 0;
  const displayName = currentUser?.name || "Cliente";
  const initials = displayName.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  const isVip = Boolean(currentUser?.creditEnabled);
  const downloadInvoice = (order, invoice) => {
    generateInvoicePDF({
      docType: invoice?.type || "Boleta",
      series: invoice?.series || (invoice?.type === "Factura" ? "F001" : "B001"),
      invoiceNumber: invoice?.number || "000001",
      orderId: order.id,
      customerName: order.customerName || displayName,
      docNumber: invoice?.customerDocument || invoice?.customerDoc || "00000000",
      items: order.items || [],
      total: order.total || 0,
      date: order.date || new Date().toISOString().split("T")[0],
      type: order.type || "direct",
      initialPayment: order.initialPayment
    });
  };
  const sendInvoice = async (order, invoice, email) => {
    const pdf = await generateInvoicePDFBase64({
      docType: invoice?.type || "Boleta",
      series: invoice?.series || (invoice?.type === "Factura" ? "F001" : "B001"),
      invoiceNumber: invoice?.number || "000001",
      orderId: order.id,
      customerName: order.customerName || displayName,
      docNumber: invoice?.customerDocument || invoice?.customerDoc || "00000000",
      items: order.items || [],
      total: order.total || 0,
      date: order.date || new Date().toISOString().split("T")[0],
      type: order.type || "direct",
      initialPayment: order.initialPayment
    });
    const response = await sendInvoiceEmailApi({
      email,
      orderId: order.id,
      pdfBase64: pdf.base64,
      pdfFileName: pdf.fileName,
      docType: invoice?.type || "Boleta",
      fullInvoiceCode: `${invoice?.series || "B001"}-${invoice?.number || "000001"}`,
      customerName: order.customerName || displayName,
      total: order.total
    });
    if (!response?.success) {
      throw new Error(response?.message || "No se pudo enviar el comprobante.");
    }
    setSentInvoices((previous) => ({ ...previous, [order.id]: true }));
  };
  const handleLogout = () => {
    logout();
    onLogout();
  };
  if (isOpen && emailInvoice) return <InvoiceEmailModal
    isOpen
    onClose={() => setEmailInvoice(null)}
    defaultEmail={currentUser?.email || ""}
    invoiceLabel={emailInvoice.invoice ? `${emailInvoice.invoice.type} ${emailInvoice.invoice.series}-${emailInvoice.invoice.number}` : "Comprobante de compra"}
    onSend={email => sendInvoice(emailInvoice.order, emailInvoice.invoice, email)}
  />;

  return isOpen ? <ShopModal drawer title={displayName} eyebrow={currentUser?.email || "Tu cuenta Masterly"} onClose={onClose}><div className="mx-6 mt-5 grid shrink-0 grid-cols-3 gap-1 border-b border-shop-line pb-3">
                {[["summary", "Resumen", BarChart3], ["orders", "Pedidos", Package], ["invoices", "Comprobantes", FileText]].map(([tab, label, Icon]) => <button type="button" key={tab} onClick={() => setActiveTab(tab)} className="flex items-center justify-center gap-1 border-b border-transparent px-1 py-3 text-[11px] text-shop-muted hover:text-shop-ink aria-pressed:border-shop-ink aria-pressed:text-shop-ink" aria-pressed={activeTab === tab}>
                    <Icon className="w-4 h-4" /> {label}
                  </button>)}
              </div><div className="flex-1 overflow-y-auto p-5 sm:p-8">
              {activeTab === "summary" && <div className="space-y-5">
                  <section className="rounded-none bg-shop-ink p-6 text-white">
                    <div className="flex items-center justify-between text-emerald-300">
                      <span className="flex items-center gap-2 text-xs font-medium"><CreditCard className="w-4 h-4" /> Línea de crédito activa</span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium">{isVip ? "B2B Corporativo" : "Pago directo"}</span>
                    </div>
                    <p className="mt-7 text-xs font-medium tracking-wider text-slate-300">Saldo disponible para manufactura</p>
                    <p className="mt-1 text-4xl font-medium">S/ {creditAvailable.toLocaleString("es-PE")}</p>
                    <div className="mt-6 border-t border-white/10 pt-4 text-sm">
                      <div className="flex justify-between"><span className="text-slate-300">Límite total</span><strong>S/ {creditLimit.toLocaleString("es-PE")}</strong></div>
                      <div className="mt-2 flex justify-between"><span className="text-slate-300">Crédito utilizado</span><strong className="text-amber-300">S/ {creditUsed.toLocaleString("es-PE")}</strong></div>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-slate-700"><div className="h-full rounded-full bg-emerald-400" style={{
              width: `${creditPercent}%`
            }} /></div>
                    <div className="mt-2 flex justify-between text-[11px] text-slate-300"><span>{creditPercent.toFixed(0)}% usado</span><span className="text-emerald-300">{(100 - creditPercent).toFixed(0)}% disponible</span></div>
                    <button type="button" onClick={() => {
            onClose();
            onSetView("pedido");
          }} className="mt-6 flex w-full items-center justify-center gap-2 rounded-none bg-shop-blue py-3 text-xs font-medium tracking-wider hover:bg-shop-blue">
                      Solicitar pedido a medida (50% adelanto) <ArrowRight className="w-4 h-4" />
                    </button>
                  </section>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-none border border-shop-line bg-white p-5"><p className="text-[11px] font-medium tracking-wider text-shop-muted">Total invertido</p><p className="mt-2 text-2xl font-medium text-shop-ink">S/ {totalInvested.toFixed(2)}</p></div>
                    <div className="rounded-none border border-shop-line bg-white p-5"><p className="text-[11px] font-medium tracking-wider text-shop-muted">Pedidos realizados</p><p className="mt-2 text-2xl font-medium text-shop-blue">{userOrders.length}</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => {
            onClose();
            onSetView("pedido");
          }} className="flex items-center justify-center gap-2 rounded-none bg-shop-blue py-3 text-xs font-medium text-white"><ShoppingBag className="w-4 h-4" /> Nueva compra</button>
                    <button type="button" onClick={() => {
            onClose();
            onSetView("products");
          }} className="flex items-center justify-center gap-2 rounded-none border border-shop-line bg-white py-3 text-xs font-medium text-slate-700"><Store className="w-4 h-4" /> Ir a tienda</button>
                  </div>
                </div>}

              {activeTab === "orders" && <div className="space-y-4">
                  {userOrders.length === 0 ? <EmptyState icon={ShoppingBag} text="Aún no tienes pedidos registrados." /> : userOrders.map(order => {
          const production = productionOrders.find(op => op.orderId === order.id) || order.production;
          return <section key={order._id || order.id} className="rounded-none border border-shop-line bg-white p-5">
                        <div className="flex items-center justify-between gap-3"><div><p className="font-medium text-shop-ink">{order.id}</p><p className="text-xs text-shop-muted">{order.type === "pedido" ? "A Pedido" : "Venta Directa"} · {order.date}</p></div><strong className="text-shop-blue">S/ {Number(order.total || 0).toFixed(2)}</strong></div>
                        {production ? <div className="mt-5"><p className="mb-3 text-[11px] font-medium tracking-wider text-shop-muted">Seguimiento de confección · {production.currentStage}</p><div className="flex items-start">{STAGES.map((stage, index) => {
                  const stageData = production.stages?.find(item => item.name === stage);
                  const done = stageData?.status === "completed";
                  const current = stage === production.currentStage;
                  return <React.Fragment key={stage}><div className="flex min-w-0 flex-1 flex-col items-center text-center"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-medium ${done ? "bg-emerald-500 text-white" : current ? "bg-shop-blue text-white ring-4 ring-blue-100" : "bg-shop-light text-shop-muted"}`}>{done ? <Check className="w-4 h-4" /> : index + 1}</span><span className={`mt-2 text-[11px] font-medium ${current ? "text-shop-blue" : "text-shop-muted"}`}>{stage === "Planchado y Empaquetado" ? "Empaque" : stage}</span></div>{index < STAGES.length - 1 && <div className={`mt-3 h-0.5 flex-1 ${done ? "bg-emerald-400" : "bg-slate-200"}`} />}</React.Fragment>;
                })}</div></div> : <p className="mt-4 rounded-none bg-shop-light p-3 text-xs text-shop-muted">{order.type === "direct" && order.status === "Enviado" ? "Su pedido ha sido enviado." : "Tu pedido está siendo preparado."}</p>}
                      </section>;
        })}
                </div>}

              {activeTab === "invoices" && <div className="space-y-4">
                  {userOrders.length === 0 ? <EmptyState icon={FileText} text="Todavía no tienes comprobantes emitidos." /> : userOrders.map(order => {
          const invoice = userInvoices.find(item => item.orderId === order.id);
          return <section key={order._id || order.id} className="flex items-center justify-between gap-3 rounded-none border border-shop-line bg-white p-4"><div><p className="font-medium text-shop-ink">{invoice ? `${invoice.type} ${invoice.series}-${invoice.number}` : "Comprobante de compra"}</p><p className="text-xs text-shop-muted">{order.id} · S/ {Number(order.total || 0).toFixed(2)}</p></div><div className="flex gap-2"><button type="button" title="Enviar al correo" onClick={() => setEmailInvoice({ order, invoice })} className="rounded-none border border-shop-line p-2 text-shop-muted hover:text-shop-blue">{sentInvoices[order.id] ? <Check className="w-4 h-4 text-emerald-500" /> : <Mail className="w-4 h-4" />}</button><button type="button" title="Descargar PDF" onClick={() => downloadInvoice(order, invoice)} className="rounded-none bg-shop-blue p-2 text-white hover:bg-shop-blue"><Download className="w-4 h-4" /></button></div></section>;
        })}
                </div>}
            </div><footer className="flex items-center justify-between border-t border-shop-line bg-white p-5">
              <button type="button" onClick={handleLogout} className="flex items-center gap-2 rounded-none bg-shop-light px-4 py-3 text-xs font-medium tracking-wider text-shop-muted hover:bg-red-50 hover:text-red-600"><LogOut className="w-4 h-4" /> Cerrar sesión</button>
              <button type="button" onClick={onClose} className="rounded-none bg-shop-ink px-5 py-3 text-xs font-medium tracking-wider text-white">Cerrar</button>
            </footer></ShopModal> : null;
}
function EmptyState({
  icon: Icon,
  text
}) {
  return <div className="rounded-none border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-shop-muted"><Icon className="mx-auto mb-3 h-8 w-8 text-slate-300" />{text}</div>;
}
export default CustomerDrawer;

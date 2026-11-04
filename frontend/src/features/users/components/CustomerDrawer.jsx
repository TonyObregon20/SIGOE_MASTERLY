import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  CreditCard,
  Download,
  FileText,
  LogOut,
  Mail,
  Package,
  ShoppingBag,
  Store,
  X
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { generateInvoicePDF } from "@/utils/pdfGenerator";
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
  const { logout } = useAuth();

  const userOrders = useMemo(
    () => orders.filter((order) => order.userId === currentUser?.id || order.customerName === currentUser?.name),
    [orders, currentUser]
  );
  const userInvoices = useMemo(
    () => invoices.filter((invoice) => userOrders.some((order) => order.id === invoice.orderId)),
    [invoices, userOrders]
  );
  const totalInvested = userOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const creditLimit = Number(currentUser?.creditLimit || 0);
  const creditUsed = userOrders
    .filter((order) => order.type === "pedido")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);
  const creditAvailable = Math.max(creditLimit - creditUsed, 0);
  const creditPercent = creditLimit ? Math.min((creditUsed / creditLimit) * 100, 100) : 0;
  const displayName = currentUser?.name || "Cliente";
  const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const isVip = Boolean(currentUser?.creditEnabled);

  const downloadInvoice = (order, invoice) => {
    generateInvoicePDF({
      docType: invoice?.type || "Boleta",
      series: invoice?.series || (invoice?.type === "Factura" ? "F001" : "B001"),
      invoiceNumber: invoice?.number || "000001",
      orderId: order.id,
      customerName: order.customerName || displayName,
      docNumber: invoice?.customerDoc || "00000000",
      items: order.items || [],
      total: order.total || 0,
      date: order.date || new Date().toISOString().split("T")[0],
      type: order.type || "direct",
      initialPayment: order.initialPayment
    });
  };

  const sendInvoice = async (order, invoice) => {
    try {
      await sendInvoiceEmailApi({
        email: currentUser?.email,
        orderId: order.id,
        docType: invoice?.type || "Boleta",
        fullInvoiceCode: `${invoice?.series || "B001"}-${invoice?.number || "000001"}`,
        customerName: order.customerName || displayName,
        total: order.total
      });
      setSentInvoices((previous) => ({ ...previous, [order.id]: true }));
    } catch (error) {
      console.error("Error sending invoice email:", error);
    }
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[130]">
          <motion.button
            type="button"
            aria-label="Cerrar panel de cliente"
            className="absolute inset-0 w-full bg-slate-950/50 backdrop-blur-sm cursor-default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Perfil del cliente"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="absolute right-0 top-0 h-full w-full max-w-xl bg-slate-50 shadow-2xl flex flex-col"
          >
            <header className="bg-slate-950 text-white p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-black shadow-lg shadow-blue-900/40">
                    {initials}
                    <span className="absolute -right-1 -bottom-1 w-4 h-4 rounded-full bg-emerald-400 border-[3px] border-slate-950" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">{displayName}</h2>
                    <p className="text-sm text-slate-400">{currentUser?.email || "Sin correo registrado"}</p>
                    <span className="inline-flex mt-2 items-center gap-1 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                      {isVip ? "Cliente VIP B2B Mayorista" : "Cliente Minorista"}
                    </span>
                  </div>
                </div>
                <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-white" aria-label="Cerrar">
                  <X />
                </button>
              </div>
              <div className="mt-7 grid grid-cols-3 gap-1 rounded-2xl border border-slate-800 bg-slate-900 p-1">
                {[
                  ["summary", "Resumen", BarChart3],
                  ["orders", "Pedidos", Package],
                  ["invoices", "Comprobantes", FileText]
                ].map(([tab, label, Icon]) => (
                  <button
                    type="button"
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === tab ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-5 sm:p-8">
              {activeTab === "summary" && (
                <div className="space-y-5">
                  <section className="rounded-3xl bg-gradient-to-br from-indigo-950 to-slate-900 p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between text-emerald-300">
                      <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest"><CreditCard className="w-4 h-4" /> Línea de crédito activa</span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold">{isVip ? "B2B Corporativo" : "Pago directo"}</span>
                    </div>
                    <p className="mt-7 text-xs font-bold uppercase tracking-wider text-slate-400">Saldo disponible para manufactura</p>
                    <p className="mt-1 text-4xl font-black">S/ {creditAvailable.toLocaleString("es-PE")}</p>
                    <div className="mt-6 border-t border-white/10 pt-4 text-sm">
                      <div className="flex justify-between"><span className="text-slate-400">Límite total</span><strong>S/ {creditLimit.toLocaleString("es-PE")}</strong></div>
                      <div className="mt-2 flex justify-between"><span className="text-slate-400">Crédito utilizado</span><strong className="text-amber-300">S/ {creditUsed.toLocaleString("es-PE")}</strong></div>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-slate-700"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${creditPercent}%` }} /></div>
                    <div className="mt-2 flex justify-between text-[11px] text-slate-400"><span>{creditPercent.toFixed(0)}% usado</span><span className="text-emerald-300">{(100 - creditPercent).toFixed(0)}% disponible</span></div>
                    <button type="button" onClick={() => { onClose(); onSetView("pedido"); }} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-black uppercase tracking-wider hover:bg-blue-500">
                      Solicitar pedido a medida (50% adelanto) <ArrowRight className="w-4 h-4" />
                    </button>
                  </section>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total invertido</p><p className="mt-2 text-2xl font-black text-slate-900">S/ {totalInvested.toFixed(2)}</p></div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pedidos realizados</p><p className="mt-2 text-2xl font-black text-blue-600">{userOrders.length}</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => { onClose(); onSetView("pedido"); }} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white"><ShoppingBag className="w-4 h-4" /> Nueva compra</button>
                    <button type="button" onClick={() => { onClose(); onSetView("products"); }} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700"><Store className="w-4 h-4" /> Ir a tienda</button>
                  </div>
                </div>
              )}

              {activeTab === "orders" && (
                <div className="space-y-4">
                  {userOrders.length === 0 ? <EmptyState icon={ShoppingBag} text="Aún no tienes pedidos registrados." /> : userOrders.map((order) => {
                    const production = productionOrders.find((op) => op.orderId === order.id);
                    return (
                      <section key={order._id || order.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between gap-3"><div><p className="font-black text-slate-900">{order.id}</p><p className="text-xs text-slate-500">{order.type === "pedido" ? "A Pedido" : "Venta Directa"} · {order.date}</p></div><strong className="text-blue-600">S/ {Number(order.total || 0).toFixed(2)}</strong></div>
                        {production ? <div className="mt-5"><p className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Seguimiento de confección · {production.currentStage}</p><div className="flex items-start">{STAGES.map((stage, index) => { const stageData = production.stages?.find((item) => item.name === stage); const done = stageData?.status === "completed"; const current = stage === production.currentStage; return <React.Fragment key={stage}><div className="flex min-w-0 flex-1 flex-col items-center text-center"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black ${done ? "bg-emerald-500 text-white" : current ? "bg-blue-600 text-white ring-4 ring-blue-100" : "bg-slate-100 text-slate-400"}`}>{done ? <Check className="w-4 h-4" /> : index + 1}</span><span className={`mt-2 text-[9px] font-bold ${current ? "text-blue-600" : "text-slate-400"}`}>{stage === "Planchado y Empaquetado" ? "Empaque" : stage}</span></div>{index < STAGES.length - 1 && <div className={`mt-3 h-0.5 flex-1 ${done ? "bg-emerald-400" : "bg-slate-200"}`} />}</React.Fragment>; })}</div></div> : <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Tu pedido está siendo preparado.</p>}
                      </section>
                    );
                  })}
                </div>
              )}

              {activeTab === "invoices" && (
                <div className="space-y-4">
                  {userOrders.length === 0 ? <EmptyState icon={FileText} text="Todavía no tienes comprobantes emitidos." /> : userOrders.map((order) => { const invoice = userInvoices.find((item) => item.orderId === order.id); return <section key={order._id || order.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"><div><p className="font-bold text-slate-900">{invoice ? `${invoice.type} ${invoice.series}-${invoice.number}` : "Comprobante de compra"}</p><p className="text-xs text-slate-500">{order.id} · S/ {Number(order.total || 0).toFixed(2)}</p></div><div className="flex gap-2"><button type="button" title="Enviar al correo" onClick={() => sendInvoice(order, invoice)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-blue-600">{sentInvoices[order.id] ? <Check className="w-4 h-4 text-emerald-500" /> : <Mail className="w-4 h-4" />}</button><button type="button" title="Descargar PDF" onClick={() => downloadInvoice(order, invoice)} className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"><Download className="w-4 h-4" /></button></div></section>; })}
                </div>
              )}
            </div>

            <footer className="flex items-center justify-between border-t border-slate-200 bg-white p-5">
              <button type="button" onClick={handleLogout} className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-red-50 hover:text-red-600"><LogOut className="w-4 h-4" /> Cerrar sesión</button>
              <button type="button" onClick={onClose} className="rounded-xl bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-wider text-white">Cerrar</button>
            </footer>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

function EmptyState({ icon: Icon, text }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500"><Icon className="mx-auto mb-3 h-8 w-8 text-slate-300" />{text}</div>;
}

export default CustomerDrawer;

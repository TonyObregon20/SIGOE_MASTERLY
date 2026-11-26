import InvoiceEmailModal from "@/features/invoices/components/InvoiceEmailModal";
import ChangePasswordModal from "@/features/auth/components/ChangePasswordModal";
import { ShopModal } from "@/components/shop/ShopUI";
import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, BarChart3, Check, CreditCard, Download, FileText, LockKeyhole, LogOut, Mail, Package, Settings, ShoppingBag, Store, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { generateInvoicePDF, generateInvoicePDFBase64 } from "@/utils/pdfGenerator";
import { sendInvoiceEmailApi } from "@/features/invoices/invoicesApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { formatOrderId } from "@/features/orders/ordersUtils";
const STAGES = ["Tendido", "Corte", "Costura", "Limpieza", "Planchado y Empaquetado"];
function CustomerDrawer({
  isOpen,
  onClose,
  currentUser,
  orders = [],
  invoices = [],
  productionOrders = [],
  onSetView,
  onLogout,
  onRefreshOrders,
  onRefreshInvoices
}) {
  const [activeTab, setActiveTab] = useState("summary");
  const [sentInvoices, setSentInvoices] = useState({});
  const [emailInvoice, setEmailInvoice] = useState(null);
  const [profileName, setProfileName] = useState(currentUser?.name || "");
  const [avatarColor, setAvatarColor] = useState(currentUser?.avatarColor || "blue");
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || "");
  const [invoiceNotifications, setInvoiceNotifications] = useState(currentUser?.invoiceEmailNotifications !== false);
  const [stageNotifications, setStageNotifications] = useState(currentUser?.orderStageEmailNotifications !== false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  useEffect(() => {
    if (!isOpen) {
      setIsPasswordOpen(false);
      setPasswordUpdated(false);
    }
  }, [isOpen]);
  useEffect(() => {
    setProfileName(currentUser?.name || "");
    setAvatarColor(currentUser?.avatarColor || "blue");
    setAvatarUrl(currentUser?.avatarUrl || "");
    setInvoiceNotifications(currentUser?.invoiceEmailNotifications !== false);
    setStageNotifications(currentUser?.orderStageEmailNotifications !== false);
  }, [currentUser]);
  useEffect(() => {
    if (!isOpen) return;
    onRefreshOrders?.();
    onRefreshInvoices?.();
  }, [isOpen, onRefreshOrders, onRefreshInvoices]);
  const {
    logout,
    updateProfile
  } = useAuth();
  const userOrders = useMemo(() => orders.filter((order) =>
    order.userId === currentUser?.id ||
    order.customerName === currentUser?.name ||
    order.customerEmail === currentUser?.email
  ), [orders, currentUser]);
  const userInvoices = useMemo(() => invoices.filter(invoice => userOrders.some(order => order.id === invoice.orderId)), [invoices, userOrders]);
  const totalInvested = userOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const creditLimit = Number(currentUser?.creditLimit || 0);
  const creditUsed = userOrders.filter(order => order.type === "pedido").reduce((sum, order) => sum + Number(order.total || 0), 0);
  const creditAvailable = Math.max(creditLimit - creditUsed, 0);
  const creditPercent = creditLimit ? Math.min(creditUsed / creditLimit * 100, 100) : 0;
  const displayName = currentUser?.name || "Cliente";
  const initials = displayName.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  const avatarColors = {
    blue: "bg-shop-blue text-white",
    navy: "bg-shop-ink text-white",
    emerald: "bg-emerald-600 text-white",
    indigo: "bg-indigo-600 text-white",
    slate: "bg-slate-600 text-white"
  };
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
  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      alert("La imagen debe pesar menos de 1.5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(String(reader.result || ""));
    reader.readAsDataURL(file);
  };
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const result = await updateProfile({
      name: profileName,
      avatarColor,
      avatarUrl,
      invoiceEmailNotifications: invoiceNotifications,
      orderStageEmailNotifications: stageNotifications
    });
    setSavingProfile(false);
    if (!result?.success) {
      alert(result?.message || "No se pudo guardar la configuración.");
    }
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

  return isOpen ? <><ShopModal drawer inactive={isPasswordOpen} title={displayName} eyebrow={currentUser?.email || "Tu cuenta Masterly"} onClose={onClose}><div className="mx-4 mt-5 grid shrink-0 grid-cols-4 gap-1 border-b border-shop-line pb-3 sm:mx-6">
                {[["summary", "Resumen", BarChart3], ["orders", "Pedidos", Package], ["invoices", "Comprobantes", FileText], ["settings", "Cuenta", Settings]].map(([tab, label, Icon]) => <button type="button" key={tab} onClick={() => setActiveTab(tab)} className="flex min-w-0 items-center justify-center gap-1 border-b border-transparent px-1 py-3 text-[10px] text-shop-muted hover:text-shop-ink aria-pressed:border-shop-ink aria-pressed:text-shop-ink sm:text-[11px]" aria-pressed={activeTab === tab}>
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
                        <div className="flex items-center justify-between gap-3"><div><p className="truncate font-medium text-shop-ink" title={order.id}>{formatOrderId(order.id)}</p><p className="text-xs text-shop-muted">{order.type === "pedido" ? "A Pedido" : "Venta Directa"} · {order.date}</p></div><strong className="shrink-0 text-shop-blue">S/ {Number(order.total || 0).toFixed(2)}</strong></div>
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
          return <section key={order._id || order.id} className="flex items-center justify-between gap-3 rounded-none border border-shop-line bg-white p-4"><div className="min-w-0"><p className="font-medium text-shop-ink">{invoice ? `${invoice.type} ${invoice.series}-${invoice.number}` : "Comprobante de compra"}</p><p className="truncate text-xs text-shop-muted" title={order.id}>{formatOrderId(order.id)} · S/ {Number(order.total || 0).toFixed(2)}</p></div><div className="flex shrink-0 gap-2"><button type="button" title="Enviar al correo" onClick={() => setEmailInvoice({ order, invoice })} className="rounded-none border border-shop-line p-2 text-shop-muted hover:text-shop-blue">{sentInvoices[order.id] ? <Check className="w-4 h-4 text-emerald-500" /> : <Mail className="w-4 h-4" />}</button><button type="button" title="Descargar PDF" onClick={() => downloadInvoice(order, invoice)} className="rounded-none bg-shop-blue p-2 text-white hover:bg-shop-blue"><Download className="w-4 h-4" /></button></div></section>;
        })}
                </div>}

              {activeTab === "settings" && <div className="space-y-6">
                  <section className="border border-shop-line bg-white p-5">
                    <h3 className="text-sm font-medium text-shop-ink">Personalización de cuenta</h3>
                    <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Foto de perfil" className="size-20 rounded-full object-cover" />
                      ) : (
                        <div className={`grid size-20 place-items-center rounded-full text-xl font-medium ${avatarColors[avatarColor] || avatarColors.blue}`}>{initials}</div>
                      )}
                      <div className="space-y-3">
                        <label className="block text-xs text-shop-muted">
                          Nombre visible
                          <input value={profileName} onChange={(event) => setProfileName(event.target.value)} className="mt-2 min-h-10 w-full border border-shop-line px-3 text-sm text-shop-ink sm:w-64" />
                        </label>
                        <label className="block text-xs text-shop-muted">
                          Foto o logo
                          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarUpload} className="mt-2 block w-full text-xs" />
                        </label>
                      </div>
                    </div>
                    <div className="mt-5">
                      <p className="mb-3 text-xs text-shop-muted">Color del avatar</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(avatarColors).map(([color, classes]) => (
                          <button
                            type="button"
                            key={color}
                            onClick={() => { setAvatarColor(color); setAvatarUrl(""); }}
                            aria-label={`Usar avatar ${color}`}
                            aria-pressed={avatarColor === color}
                            className={`size-9 rounded-full border-4 border-white ring-1 ring-shop-line ${classes} ${avatarColor === color ? "ring-2 ring-shop-ink" : ""}`}
                          />
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="border border-shop-line bg-white p-5">
                    <h3 className="text-sm font-medium text-shop-ink">Preferencias de correo</h3>
                    <div className="mt-4 space-y-4">
                      <label className="flex items-center justify-between gap-4 border-b border-shop-line pb-4 text-xs">
                        <span>
                          <strong className="block font-medium text-shop-ink">Comprobantes en PDF</strong>
                          <span className="mt-1 block text-shop-muted">Recibir automáticamente el comprobante al comprar.</span>
                        </span>
                        <input type="checkbox" checked={invoiceNotifications} onChange={(event) => setInvoiceNotifications(event.target.checked)} className="size-5 accent-shop-ink" />
                      </label>
                      <label className="flex items-center justify-between gap-4 text-xs">
                        <span>
                          <strong className="block font-medium text-shop-ink">Avances del pedido</strong>
                          <span className="mt-1 block text-shop-muted">Avisos al cambiar las etapas de taller.</span>
                        </span>
                        <input type="checkbox" checked={stageNotifications} onChange={(event) => setStageNotifications(event.target.checked)} className="size-5 accent-shop-ink" />
                      </label>
                    </div>
                  </section>

                  {currentUser?.role === "admin" && (
                    <section className="border border-shop-line bg-white p-5">
                      <h3 className="flex items-center gap-2 text-sm font-medium text-shop-ink"><LockKeyhole size={16} className="text-shop-blue" />Seguridad</h3>
                      <p className="mt-4 text-xs font-medium text-shop-ink">Contraseña de acceso</p>
                      <p className="mt-1 text-xs leading-6 text-shop-muted">Actualiza la contraseña de tu cuenta.</p>
                      <button type="button" onClick={() => { setPasswordUpdated(false); setIsPasswordOpen(true); }} className="mt-4 inline-flex min-h-10 items-center gap-3 border border-shop-line px-4 py-2 text-xs font-medium text-shop-ink hover:bg-shop-light">Cambiar contraseña<ArrowRight size={14} /></button>
                      {passwordUpdated && <p role="status" className="mt-4 flex items-start gap-2 text-xs leading-5 text-emerald-700"><Check size={16} className="shrink-0" />Tu contraseña se actualizó correctamente.</p>}
                    </section>
                  )}

                  <button type="button" disabled={savingProfile} onClick={handleSaveProfile} className="min-h-11 w-full bg-shop-ink text-xs font-medium text-white disabled:opacity-50">
                    {savingProfile ? "Guardando..." : "Guardar configuración"}
                  </button>
                </div>}
            </div><footer className="flex items-center justify-between border-t border-shop-line bg-white p-5">
              <button type="button" onClick={handleLogout} className="flex items-center gap-2 rounded-none bg-shop-light px-4 py-3 text-xs font-medium tracking-wider text-shop-muted hover:bg-red-50 hover:text-red-600"><LogOut className="w-4 h-4" /> Cerrar sesión</button>
              <button type="button" onClick={onClose} className="rounded-none bg-shop-ink px-5 py-3 text-xs font-medium tracking-wider text-white">Cerrar</button>
            </footer></ShopModal>
            {isPasswordOpen && currentUser?.role === "admin" && <ChangePasswordModal onClose={() => setIsPasswordOpen(false)} onSuccess={() => { setIsPasswordOpen(false); setPasswordUpdated(true); }} />}
          </> : null;
}
function EmptyState({
  icon: Icon,
  text
}) {
  return <div className="rounded-none border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-shop-muted"><Icon className="mx-auto mb-3 h-8 w-8 text-slate-300" />{text}</div>;
}
export default CustomerDrawer;

import { useRef, useState } from "react";
import { Plus, Store, Trash2, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import AdminDialog from "@/components/admin/AdminDialog";
import { money } from "@/components/shop/ShopUI";
import { IN_PERSON_SIZES, IN_PERSON_PAYMENT_METHODS, inPersonSizeStock, inPersonTotalStock, todayInLima } from "../inPersonSaleUtils";

const inputClass = "min-h-10 w-full min-w-0 rounded-[2px] border border-shop-line bg-white px-3 py-2 text-base text-shop-ink outline-none focus:border-shop-blue disabled:bg-shop-light sm:text-[13px]";
function Field({ name, label, error, children }) {
  return <div className="min-w-0 space-y-2"><label htmlFor={`pos-${name}`} className="block text-xs text-shop-muted">{label}</label>{children({ id: `pos-${name}`, "aria-invalid": Boolean(error), "aria-describedby": error ? `pos-${name}-error` : undefined })}{error && <p id={`pos-${name}-error`} role="alert" className="text-xs text-red-700">{error}</p>}</div>;
}

export default function InPersonSaleModal({ products = [], users = [], onClose, onRegister }) {
  const reduceMotion = useReducedMotion();
  const [requestId] = useState(() => crypto.randomUUID());
  const [form, setForm] = useState({ date: todayInLima(), customerId: "", customerName: "", customerDocument: "", customerEmail: "", customerPhone: "", customerAddress: "", docType: "Boleta", paymentMethod: "Efectivo", paymentReference: "", notes: "" });
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState({ productId: "", selectedSize: "", quantity: "1" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const selectedProduct = products.find(product => product.id === draft.productId);
  const customers = users.filter(user => user.role === "customer");
  const total = items.reduce((sum, item) => sum + Math.round(Number(products.find(product => product.id === item.productId)?.price || 0) * 100) * Number(item.quantity || 0), 0) / 100;
  const units = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const change = (name, value) => { setForm(previous => ({ ...previous, [name]: value })); setErrors(previous => ({ ...previous, [name]: "", form: "" })); };
  const close = () => { if (!submitting.current) onClose(); };
  const stockError = rows => {
    const totals = new Map();
    for (const item of rows) {
      const product = products.find(product => product.id === item.productId);
      const quantity = Number(item.quantity);
      if (!product || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000) return "Ingresa cantidades enteras entre 1 y 1000.";
      if (quantity > inPersonSizeStock(product, item.selectedSize)) return `Stock insuficiente: ${product.name}, talla ${item.selectedSize}.`;
      totals.set(item.productId, (totals.get(item.productId) || 0) + quantity);
      if (totals.get(item.productId) > inPersonTotalStock(product)) return `Las cantidades superan el stock disponible de ${product.name}.`;
    }
    return "";
  };
  const addItem = () => {
    if (!selectedProduct || !IN_PERSON_SIZES.includes(draft.selectedSize)) { setErrors(previous => ({ ...previous, items: "Selecciona un producto y una talla disponible." })); return; }
    const existing = items.find(item => item.productId === draft.productId && item.selectedSize === draft.selectedSize);
    const next = existing ? items.map(item => item === existing ? { ...item, quantity: Number(item.quantity) + Number(draft.quantity) } : item) : [...items, { ...draft, quantity: Number(draft.quantity) }];
    const error = next.length > 100 ? "Puedes agregar hasta 100 líneas por venta." : stockError(next);
    if (error) { setErrors(previous => ({ ...previous, items: error })); return; }
    setItems(next);
    setDraft(previous => ({ ...previous, quantity: "1" }));
    setErrors(previous => ({ ...previous, items: "", form: "" }));
  };
  const submit = async event => {
    event.preventDefault();
    if (submitting.current) return;
    const validation = {};
    if (form.customerName.trim().length < 3) validation.customerName = "Ingresa el nombre completo o razón social.";
    if (!form.date || form.date > todayInLima() || form.date < "2000-01-01") validation.date = "Selecciona una fecha válida que no sea futura.";
    if (!(form.docType === "Factura" ? /^\d{11}$/ : /^\d{8}$/).test(form.customerDocument)) validation.customerDocument = form.docType === "Factura" ? "El RUC debe tener 11 dígitos." : "El DNI debe tener 8 dígitos.";
    if (form.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail.trim())) validation.customerEmail = "Ingresa un correo válido.";
    if (form.docType === "Factura" && !form.customerAddress.trim()) validation.customerAddress = "Ingresa la dirección fiscal.";
    if (!items.length) validation.items = "Agrega al menos una prenda a la venta.";
    else if (stockError(items)) validation.items = stockError(items);
    if (!(total > 0)) validation.items ||= "La venta debe tener un total mayor que cero.";
    setErrors(validation);
    if (Object.keys(validation).length) return;
    submitting.current = true;
    setSaving(true);
    try {
      const result = await onRegister({ requestId, ...form, items: items.map(({ productId, selectedSize, quantity }) => ({ productId, selectedSize, quantity: Number(quantity) })) });
      if (result?.success) { onClose(); return; }
      setErrors({ [result?.field || "form"]: result?.message || "No se pudo registrar la venta. Inténtalo de nuevo." });
    } catch {
      setErrors({ form: "No se pudo confirmar la venta. Vuelve a intentar sin cerrar este formulario para evitar duplicados." });
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  return <AdminDialog label="Registrar venta presencial" onClose={close} className="fixed inset-0 z-[130] flex items-center justify-center bg-shop-dark/50 p-3 sm:p-6">
    <motion.section initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="flex max-h-[94dvh] w-full max-w-[1040px] flex-col overflow-hidden border border-shop-line bg-white">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-shop-line p-5 sm:px-7 sm:py-6">
        <div><p className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[.12em] text-shop-blue"><Store size={14} />Venta en tienda</p><h2 className="text-2xl font-medium tracking-tight">Registrar venta presencial</h2><p className="mt-2 text-xs leading-5 text-shop-muted">Pago completo y entrega al cliente en el local.</p></div>
        <button type="button" disabled={saving} onClick={close} aria-label="Cerrar registro de venta" className="p-2 text-shop-muted disabled:opacity-40"><X size={20} /></button>
      </header>
      <form onSubmit={submit} noValidate aria-busy={saving} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_280px]">
            <fieldset disabled={saving} className="min-w-0 space-y-7 p-5 sm:p-7">
              <section className="space-y-4">
                <h3 className="text-sm font-medium">Datos de la venta</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field name="date" label="Fecha de venta" error={errors.date}>{props => <input {...props} type="date" min="2000-01-01" max={todayInLima()} value={form.date} onChange={event => change("date", event.target.value)} required className={inputClass} />}</Field>
                  <Field name="docType" label="Comprobante" error={errors.docType}>{props => <select {...props} value={form.docType} onChange={event => { change("docType", event.target.value); change("customerDocument", ""); }} className={inputClass}><option>Boleta</option><option>Factura</option></select>}</Field>
                </div>
              </section>
              <section className="space-y-4 border-t border-shop-line pt-6">
                <div><h3 className="text-sm font-medium">Datos del cliente</h3><p className="mt-1 text-xs leading-5 text-shop-muted">Puede comprar sin tener una cuenta en la web.</p></div>
                <Field name="customerId" label="Cliente registrado (opcional)" error={errors.customerId}>{props => <select {...props} value={form.customerId} onChange={event => {
                  const user = customers.find(user => user.id === event.target.value);
                  setForm(previous => ({ ...previous, customerId: event.target.value, customerName: user?.name || "", customerEmail: user?.email || "", customerPhone: user?.phone || "", customerDocument: "", customerAddress: "" }));
                  setErrors({});
                }} className={inputClass}><option value="">Cliente sin cuenta web</option>{customers.map(user => <option key={user.id} value={user.id}>{user.name} · {user.email}</option>)}</select>}</Field>
                <Field name="customerName" label={form.docType === "Factura" ? "Razón social" : "Nombre completo"} error={errors.customerName}>{props => <input {...props} value={form.customerName} onChange={event => change("customerName", event.target.value)} maxLength={160} required autoComplete="off" className={inputClass} />}</Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field name="customerDocument" label={form.docType === "Factura" ? "RUC" : "DNI"} error={errors.customerDocument}>{props => <input {...props} inputMode="numeric" value={form.customerDocument} onChange={event => change("customerDocument", event.target.value.replace(/\D/g, ""))} maxLength={form.docType === "Factura" ? 11 : 8} required className={inputClass} />}</Field>
                  <Field name="customerPhone" label="Teléfono (opcional)" error={errors.customerPhone}>{props => <input {...props} type="tel" value={form.customerPhone} onChange={event => change("customerPhone", event.target.value)} maxLength={30} className={inputClass} />}</Field>
                </div>
                <Field name="customerEmail" label="Correo electrónico (opcional)" error={errors.customerEmail}>{props => <input {...props} type="email" value={form.customerEmail} onChange={event => change("customerEmail", event.target.value)} maxLength={254} className={inputClass} />}</Field>
                <Field name="customerAddress" label={form.docType === "Factura" ? "Dirección fiscal" : "Dirección (opcional)"} error={errors.customerAddress}>{props => <input {...props} value={form.customerAddress} onChange={event => change("customerAddress", event.target.value)} required={form.docType === "Factura"} maxLength={300} className={inputClass} />}</Field>
              </section>
              <section className="space-y-4 border-t border-shop-line pt-6">
                <h3 className="text-sm font-medium">Prendas y tallas</h3>
                <div className="space-y-3 border border-shop-line bg-shop-light p-4">
                  <Field name="product" label="Producto">{props => <select {...props} value={draft.productId} onChange={event => setDraft(previous => ({ ...previous, productId: event.target.value, selectedSize: "" }))} className={inputClass}><option value="">Selecciona una camisa</option>{products.map(product => <option key={product.id} value={product.id} disabled={inPersonTotalStock(product) < 1}>{product.name} · {money(product.price)}</option>)}</select>}</Field>
                  {selectedProduct && IN_PERSON_SIZES.every(size => inPersonSizeStock(selectedProduct, size) < 1) && <p className="text-xs leading-5 text-amber-800">No hay stock disponible por talla para este producto. Revisa las existencias en Almacén.</p>}
                  <div className="grid grid-cols-2 gap-3">
                    <Field name="size" label="Talla disponible">{props => <select {...props} disabled={!selectedProduct} value={draft.selectedSize} onChange={event => setDraft(previous => ({ ...previous, selectedSize: event.target.value }))} className={inputClass}><option value="">Selecciona talla</option>{IN_PERSON_SIZES.map(size => <option key={size} value={size} disabled={inPersonSizeStock(selectedProduct, size) < 1}>{size} · {inPersonSizeStock(selectedProduct, size)} disp.</option>)}</select>}</Field>
                    <Field name="quantity" label="Cantidad">{props => <input {...props} type="number" min="1" max="1000" step="1" value={draft.quantity} onChange={event => setDraft(previous => ({ ...previous, quantity: event.target.value }))} className={inputClass} />}</Field>
                  </div>
                  <button type="button" onClick={addItem} className="inline-flex min-h-10 w-full items-center justify-center gap-2 border border-shop-line bg-white px-4 text-xs font-medium hover:border-shop-blue"><Plus size={15} />Agregar prenda</button>
                </div>
                {errors.items && <p role="alert" className="text-xs leading-5 text-red-700">{errors.items}</p>}
                {items.length ? <div className="divide-y divide-shop-line border-y border-shop-line">{items.map(item => {
                  const product = products.find(product => product.id === item.productId);
                  return <div key={`${item.productId}:${item.selectedSize}`} className="grid grid-cols-[minmax(0,1fr)_64px_76px_32px] items-center gap-2 py-4 sm:gap-3"><div className="min-w-0"><p className="text-xs font-medium leading-5">{product?.name || item.productId}</p><p className="mt-1 text-[11px] text-shop-muted">Talla {item.selectedSize} · {money(product?.price)} c/u</p></div><input aria-label={`Cantidad de ${product?.name || item.productId} talla ${item.selectedSize}`} type="number" min="1" max="1000" step="1" value={item.quantity} onChange={event => { setItems(previous => previous.map(row => row === item ? { ...row, quantity: event.target.value } : row)); setErrors(previous => ({ ...previous, items: "" })); }} className={`${inputClass} px-2 text-center`} /><span className="text-right text-xs font-medium tabular-nums">{money((Number(product?.price) || 0) * Number(item.quantity || 0))}</span><button type="button" onClick={() => setItems(previous => previous.filter(row => row !== item))} aria-label={`Quitar ${product?.name || item.productId} talla ${item.selectedSize}`} className="p-2 text-shop-muted hover:text-red-700"><Trash2 size={15} /></button></div>;
                })}</div> : <p className="py-3 text-center text-xs text-shop-muted">Agrega las prendas que se entregan al cliente.</p>}
              </section>
              <section className="space-y-4 border-t border-shop-line pt-6">
                <h3 className="text-sm font-medium">Pago y observaciones</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field name="paymentMethod" label="Medio de pago" error={errors.paymentMethod}>{props => <select {...props} value={form.paymentMethod} onChange={event => change("paymentMethod", event.target.value)} className={inputClass}>{IN_PERSON_PAYMENT_METHODS.map(method => <option key={method}>{method}</option>)}</select>}</Field>
                  <Field name="paymentReference" label="N.º de operación (opcional)">{props => <input {...props} value={form.paymentReference} onChange={event => change("paymentReference", event.target.value)} maxLength={160} className={inputClass} />}</Field>
                </div>
                <Field name="notes" label="Observaciones (opcional)">{props => <textarea {...props} rows={3} value={form.notes} onChange={event => change("notes", event.target.value)} maxLength={500} className={inputClass} />}</Field>
              </section>
            </fieldset>
            <aside className="border-t border-shop-line bg-shop-light p-5 lg:border-t-0 lg:border-l lg:p-6">
              <div className="space-y-5 lg:sticky lg:top-6"><h3 className="text-lg font-medium tracking-tight">Resumen de venta</h3><span className="inline-flex border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">Directa · Presencial</span><dl className="space-y-3 text-xs"><div className="flex justify-between gap-3"><dt className="text-shop-muted">Prendas</dt><dd className="tabular-nums">{units || 0}</dd></div><div className="flex justify-between gap-3"><dt className="text-shop-muted">Comprobante</dt><dd>{form.docType}</dd></div><div className="flex justify-between gap-3"><dt className="text-shop-muted">Pago</dt><dd>{form.paymentMethod}</dd></div></dl><div className="flex items-baseline justify-between border-t border-shop-line pt-5"><span className="text-sm">Total cobrado</span><strong className="text-2xl font-medium tabular-nums">{money(total)}</strong></div><p className="text-[11px] leading-6 text-shop-muted">Precios del catálogo, IGV incluido. Al registrar, las prendas se entregan en tienda y se descuenta el stock en Almacén y Kardex. No requiere guía.</p></div>
            </aside>
          </div>
        </div>
        {errors.form && <p role="alert" className="border-t border-shop-line px-5 py-3 text-xs leading-5 text-red-700 sm:px-7">{errors.form}</p>}
        <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-shop-line bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><p className="text-[11px] text-shop-muted">Venta pagada y entregada en el local.</p><div className="flex gap-3"><button type="button" disabled={saving} onClick={close} className="min-h-11 flex-1 border border-shop-line px-5 text-xs font-medium disabled:opacity-50 sm:flex-none">Cancelar</button><button type="submit" disabled={saving || !items.length} className="min-h-11 flex-1 bg-shop-ink px-5 text-xs font-medium text-white disabled:opacity-50 sm:flex-none">{saving ? "Registrando…" : "Registrar venta"}</button></div></footer>
      </form>
    </motion.section>
  </AdminDialog>;
}

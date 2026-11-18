import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { ShopButton, ShopField, ShopModal, shopInput } from "@/components/shop/ShopUI";

export default function InvoiceEmailModal({
  isOpen,
  onClose,
  defaultEmail = "",
  invoiceLabel = "Comprobante de compra",
  onSend
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail(defaultEmail);
      setStatus(null);
    }
  }, [defaultEmail, isOpen]);

  if (!isOpen) return null;

  const close = () => {
    if (!sending) onClose();
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (sending || !email.trim()) return;

    setSending(true);
    setStatus(null);
    try {
      await onSend(email.trim());
      setStatus({ success: true, message: "Comprobante enviado correctamente." });
    } catch (error) {
      setStatus({ success: false, message: error.message || "No se pudo enviar el comprobante." });
    } finally {
      setSending(false);
    }
  };

  return (
    <ShopModal title="Enviar comprobante" eyebrow={invoiceLabel} onClose={close}>
      <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-7">
        <ShopField label="Correo de destino">
          {id => (
            <input
              id={id}
              type="email"
              required
              value={email}
              disabled={sending}
              onChange={event => setEmail(event.target.value)}
              autoComplete="email"
              className={shopInput}
            />
          )}
        </ShopField>
        {status && (
          <p
            role={status.success ? "status" : "alert"}
            className={`border p-3 text-xs ${status.success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}
          >
            {status.message}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-3">
          <ShopButton variant="outline" onClick={close} disabled={sending}>
            {status?.success ? "Volver" : "Cancelar"}
          </ShopButton>
          <ShopButton type="submit" disabled={sending}>
            <Send size={15} />
            {sending ? "Enviando…" : "Enviar"}
          </ShopButton>
        </div>
      </form>
    </ShopModal>
  );
}

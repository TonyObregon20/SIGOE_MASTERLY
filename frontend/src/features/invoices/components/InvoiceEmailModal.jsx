import React, { useEffect, useState } from "react";
import { Mail, Send, X } from "lucide-react";

export default function InvoiceEmailModal({
  isOpen,
  onClose,
  defaultEmail = "",
  invoiceLabel = "comprobante",
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim()) {
      setStatus({ type: "error", message: "Ingresa un correo electrónico." });
      return;
    }

    setSending(true);
    setStatus(null);
    try {
      await onSend(email.trim());
      setStatus({ type: "success", message: "Comprobante enviado correctamente." });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "No se pudo enviar el comprobante." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar modal de correo"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />
      <form onSubmit={handleSubmit} className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-700" aria-label="Cerrar">
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-900">Enviar comprobante</h3>
            <p className="text-xs text-slate-500">{invoiceLabel}</p>
          </div>
        </div>
        <label className="mt-6 block text-xs font-bold uppercase tracking-wider text-slate-500">
          Correo de destino
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="cliente@correo.com"
            autoFocus
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        {status && (
          <p className={`mt-3 rounded-lg p-3 text-xs ${status.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {status.message}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
          <button type="submit" disabled={sending} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">
            <Send className="h-4 w-4" />
            {sending ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </form>
    </div>
  );
}

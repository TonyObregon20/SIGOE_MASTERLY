import React, { useRef, useState } from "react";
import GuideEvidenceFields from "./GuideEvidenceFields";
import { validateGuideFields } from "../guideUtils";

export default function GuideDispatchModal({ order, movements, onSubmit, onClose }) {
  const [evidence, setEvidence] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState({});
  const sending = useRef(false);
  const locked = busy || Object.values(reading).some(Boolean);
  const update = (id, field, value) => setEvidence((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  const submit = async (event) => {
    event.preventDefault();
    if (sending.current || locked) return;
    setError("");
    try {
      const guides = movements.map((m) => {
        const value = evidence[m.id] || {};
        validateGuideFields(value.guideNumber, value.guidePhoto);
        return { movementId: m.id, ...value };
      });
      sending.current = true;
      setBusy(true);
      const payload = guides.length === 1 ? guides[0] : { guides };
      const result = await onSubmit(order.id, payload);
      if (!result?.success) throw new Error(result?.message || "No se pudo confirmar el despacho.");
      onClose();
    } catch (err) { setError(err.message); }
    finally { sending.current = false; setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-[130] bg-slate-950/60 p-3 sm:p-5 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="dispatch-guide-title">
      <form onSubmit={submit} className="w-full max-w-xl max-h-[90dvh] overflow-y-auto bg-white rounded-2xl p-5 sm:p-7 space-y-5 shadow-2xl">
        <div className="flex justify-between items-start gap-3"><div><h2 id="dispatch-guide-title" className="text-xl font-bold">Confirmar despacho</h2><p className="text-sm text-slate-500 mt-2">Pedido {order.id}. Ingresa nuevamente el número y selecciona la fotografía de la guía.</p></div><button type="button" disabled={locked} onClick={onClose} aria-label="Cerrar confirmación de despacho" className="p-2 disabled:opacity-40">✕</button></div>
        {movements.map((m) => <fieldset disabled={busy} key={m.id} className="border border-slate-200 rounded-xl p-4 space-y-3"><legend className="px-2 text-xs font-bold">Salida {m.id}</legend><GuideEvidenceFields number={evidence[m.id]?.guideNumber || ""} photo={evidence[m.id]?.guidePhoto || ""} onNumberChange={(v) => update(m.id, "guideNumber", v)} onPhotoChange={(v) => update(m.id, "guidePhoto", v)} disabled={locked} onError={setError} onBusyChange={(v) => setReading((prev) => ({ ...prev, [m.id]: v }))} /></fieldset>)}
        {error && <p role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 p-3 rounded-xl">{error}</p>}
        <div className="flex flex-col-reverse sm:flex-row gap-3"><button type="button" disabled={locked} onClick={onClose} className="flex-1 p-3 border rounded-xl disabled:opacity-40">Cancelar</button><button type="submit" disabled={locked} className="flex-1 p-3 bg-emerald-700 text-white font-bold rounded-xl disabled:opacity-40">{busy ? "Verificando…" : "Verificar y despachar"}</button></div>
      </form>
    </div>
  );
}

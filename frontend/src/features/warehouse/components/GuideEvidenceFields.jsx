import React, { useId, useRef } from "react";
import { readGuidePhoto } from "../guideUtils";

export default function GuideEvidenceFields({ number, photo, onNumberChange, onPhotoChange, disabled, onBusyChange, onError }) {
  const id = useId();
  const reading = useRef(false);
  const pickPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file || reading.current) return;
    reading.current = true;
    onBusyChange?.(true);
    onPhotoChange("");
    onError("");
    try { onPhotoChange(await readGuidePhoto(file)); }
    catch (err) { onError(err.message); event.target.value = ""; }
    finally { reading.current = false; onBusyChange?.(false); }
  };
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${id}-number`} className="block text-sm font-bold text-slate-800 mb-1">Número de guía *</label>
        <input id={`${id}-number`} type="text" required maxLength={100} autoComplete="off" value={number} disabled={disabled} onChange={(e) => onNumberChange(e.target.value)} className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Ej.: GR-0012" />
        <p className="mt-1 text-xs text-slate-500">Respeta exactamente letras, ceros, guiones y espacios del número original.</p>
      </div>
      <div>
        <label htmlFor={`${id}-photo`} className="block text-sm font-bold text-slate-800 mb-1">Fotografía de la guía *</label>
        <input id={`${id}-photo`} type="file" accept="image/jpeg,image/png,image/webp" required={!photo} disabled={disabled} onChange={pickPhoto} className="w-full text-sm border border-slate-300 p-3 rounded-xl file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:p-2 file:text-blue-800" />
        <p className="mt-1 text-xs text-slate-500">JPG, PNG o WebP. Máximo 1 MB.</p>
        {photo && <img src={photo} alt="Vista previa de la fotografía de la guía" className="mt-3 max-h-48 w-full object-contain rounded-xl border bg-slate-50" />}
      </div>
    </div>
  );
}

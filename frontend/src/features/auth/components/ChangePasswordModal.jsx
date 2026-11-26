import { useRef, useState } from "react";
import { ShopButton, ShopModal, shopInput } from "@/components/shop/ShopUI";
import { changeMyPasswordApi } from "../authApi";

export default function ChangePasswordModal({ onClose, onSuccess }) {
  const [values, setValues] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const fields = [
    ["currentPassword", "Contraseña actual", "Ingresa tu contraseña actual", "current-password"],
    ["newPassword", "Nueva contraseña", "Escribe una nueva contraseña", "new-password"],
    ["confirmPassword", "Confirmar nueva contraseña", "Repite la nueva contraseña", "new-password"]
  ];
  const submit = async (event) => {
    event.preventDefault();
    if (submitting.current) return;
    const validation = {};
    if (!values.currentPassword) validation.currentPassword = "Ingresa tu contraseña actual.";
    if (values.newPassword.length < 8) validation.newPassword = "Usa al menos 8 caracteres.";
    else if (new TextEncoder().encode(values.newPassword).length > 72) validation.newPassword = "La contraseña es demasiado larga. Elige una más corta.";
    else if (values.newPassword === values.currentPassword) validation.newPassword = "Elige una contraseña diferente a la actual.";
    if (values.confirmPassword !== values.newPassword) validation.confirmPassword = "Las contraseñas no coinciden.";
    setErrors(validation);
    if (Object.keys(validation).length) return;
    submitting.current = true;
    setSaving(true);
    try {
      const result = await changeMyPasswordApi(values);
      if (!result?.success) {
        const field = fields.some(([name]) => name === result?.field) ? result.field : "form";
        setErrors({ [field]: result?.message || "No se pudo actualizar la contraseña. Inténtalo de nuevo." });
        return;
      }
      setValues({ currentPassword: "", newPassword: "", confirmPassword: "" });
      onSuccess();
    } catch {
      setErrors({ form: "No se pudo conectar con el servidor. Inténtalo de nuevo." });
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  return (
    <ShopModal title="Cambiar contraseña" eyebrow="Seguridad" onClose={() => { if (!submitting.current) onClose(); }} animateOnOpen>
      <form onSubmit={submit} noValidate aria-busy={saving}>
        <div className="space-y-5 p-6 sm:p-7">
          <p className="text-sm text-shop-muted">Solo modificarás tu propia cuenta.</p>
          {fields.map(([name, label, placeholder, autoComplete]) => (
            <div key={name} className="space-y-2">
              <label htmlFor={`change-${name}`} className="block text-xs text-shop-muted">{label}</label>
              <input id={`change-${name}`} name={name} type="password" autoComplete={autoComplete} placeholder={placeholder} required disabled={saving} value={values[name]} onChange={event => {
                setValues(previous => ({ ...previous, [name]: event.target.value }));
                setErrors(previous => ({ ...previous, [name]: "", form: "" }));
              }} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `change-${name}-error` : name === "newPassword" ? "change-password-help" : undefined} className={`${shopInput} aria-invalid:border-red-700 disabled:opacity-60`} />
              {name === "newPassword" && <p id="change-password-help" className="text-xs text-shop-muted">Usa al menos 8 caracteres.</p>}
              {errors[name] && <p id={`change-${name}-error`} role="alert" className="text-xs text-red-700">{errors[name]}</p>}
            </div>
          ))}
          {errors.form && <p role="alert" className="border-l-2 border-red-700 pl-3 text-sm text-red-700">{errors.form}</p>}
        </div>
        <footer className="flex flex-col-reverse gap-3 border-t border-shop-line p-6 sm:flex-row sm:justify-end sm:p-7">
          <ShopButton variant="outline" disabled={saving} onClick={onClose}>Cancelar</ShopButton>
          <ShopButton type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar contraseña"}</ShopButton>
        </footer>
      </form>
    </ShopModal>
  );
}

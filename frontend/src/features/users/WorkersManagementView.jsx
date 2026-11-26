import React, { useMemo, useState } from "react";
import { Eye, EyeOff, Plus, UserCog, X } from "lucide-react";
import AdminDialog from "@/components/admin/AdminDialog";

export default function WorkersManagementView({ users = [], onUpdateWorker, onAddWorker }) {
  const workers = useMemo(() => users.filter((user) => user.role === "worker"), [users]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setShowPassword(false);
    setOpen(true);
  };

  const openEdit = (worker) => {
    setEditing(worker);
    setShowPassword(false);
    setOpen(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      email: String(form.get("email") || "").trim().toLowerCase(),
      workerPosition: form.get("workerPosition"),
      phone: form.get("phone"),
      hourlyRate: Number(form.get("hourlyRate") || 0),
      isActive: form.get("isActive") === "true",
      role: "worker"
    };
    let result;
    if (editing) {
      const password = form.get("password");
      result = await onUpdateWorker(editing.id, password ? { ...payload, password } : payload);
    } else {
      result = await onAddWorker({
        ...payload,
        password: form.get("password"),
        joinDate: new Date().toISOString().slice(0, 10)
      });
    }
    if (!result?.success) {
      alert(result?.message || "No se pudo guardar el trabajador.");
      return;
    }
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-shop-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-[28px] font-medium text-shop-ink"><UserCog className="size-6 text-shop-blue" /> Gestión de Trabajadores</h1>
          <p className="mt-1 text-xs text-shop-muted">Administra accesos, cargos y sueldo por hora.</p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex min-h-10 items-center gap-2 bg-shop-ink px-5 py-2 text-xs font-semibold text-white"><Plus className="size-4" /> Nuevo trabajador</button>
      </div>

      {workers.length === 0 ? (
        <div className="border border-shop-line bg-white py-16 text-center text-sm text-shop-muted">No hay trabajadores registrados.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {workers.map((worker) => (
            <article key={worker.id} className="border border-shop-line bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-shop-ink">{worker.name}</h2>
                  <p className="mt-1 break-all text-xs text-shop-muted">{worker.email}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${worker.isActive === false ? "border-slate-200 bg-slate-100 text-slate-600" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                  {worker.isActive === false ? "Inactivo" : "Activo"}
                </span>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
                <div><dt className="text-shop-muted">Cargo</dt><dd className="mt-1 font-medium">{worker.workerPosition || "Sin cargo"}</dd></div>
                <div><dt className="text-shop-muted">Sueldo por hora</dt><dd className="mt-1 font-semibold text-shop-blue">S/ {Number(worker.hourlyRate || 0).toFixed(2)}</dd></div>
              </dl>
              <button type="button" onClick={() => openEdit(worker)} className="mt-5 min-h-9 w-full border border-shop-line text-xs font-medium hover:bg-shop-light">Editar trabajador</button>
            </article>
          ))}
        </div>
      )}

      {open && (
        <AdminDialog label="Datos del trabajador" onClose={() => setOpen(false)} className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-shop-ink/60" onClick={() => setOpen(false)} />
          <form onSubmit={handleSave} className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto border border-shop-line bg-white">
            <header className="flex items-center justify-between border-b border-shop-line px-6 py-4">
              <h2 className="text-lg font-medium">{editing ? "Editar trabajador" : "Nuevo trabajador"}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar"><X className="size-5" /></button>
            </header>
            <div className="space-y-4 p-6">
              <label className="block text-xs text-shop-muted">Nombre completo<input name="name" defaultValue={editing?.name || ""} required className="mt-2 min-h-11 w-full border border-shop-line px-3 text-sm" /></label>
              <label className="block text-xs text-shop-muted">Correo<input name="email" type="email" defaultValue={editing?.email || ""} required className="mt-2 min-h-11 w-full border border-shop-line px-3 text-sm" /></label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-xs text-shop-muted">Cargo / posición<input name="workerPosition" defaultValue={editing?.workerPosition || ""} placeholder="Operario, almacén..." required className="mt-2 min-h-11 w-full border border-shop-line px-3 text-sm" /></label>
                <label className="block text-xs text-shop-muted">Sueldo por hora (S/)<input name="hourlyRate" type="number" min="0" step="0.10" defaultValue={editing?.hourlyRate || 0} required className="mt-2 min-h-11 w-full border border-shop-line px-3 text-sm" /></label>
              </div>
              <label className="block text-xs text-shop-muted">Teléfono<input name="phone" defaultValue={editing?.phone || ""} className="mt-2 min-h-11 w-full border border-shop-line px-3 text-sm" /></label>
              <label className="block text-xs text-shop-muted">{editing ? "Nueva contraseña (opcional)" : "Contraseña inicial"}<span className="relative block"><input name="password" type={showPassword ? "text" : "password"} required={!editing} minLength={8} className="mt-2 min-h-11 w-full border border-shop-line px-3 pr-12 text-sm" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-0 top-2 flex size-11 items-center justify-center" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></span></label>
              {editing && <label className="block text-xs text-shop-muted">Estado<select name="isActive" defaultValue={editing.isActive === false ? "false" : "true"} className="mt-2 min-h-11 w-full border border-shop-line px-3 text-sm"><option value="true">Activo</option><option value="false">Inactivo</option></select></label>}
            </div>
            <footer className="flex justify-end gap-2 border-t border-shop-line px-6 py-4"><button type="button" onClick={() => setOpen(false)} className="min-h-10 border border-shop-line px-4 text-xs">Cancelar</button><button type="submit" className="min-h-10 bg-shop-ink px-5 text-xs text-white">Guardar</button></footer>
          </form>
        </AdminDialog>
      )}
    </div>
  );
}

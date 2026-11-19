import AdminDialog from "@/components/admin/AdminDialog";
import React, { useState, useEffect, useMemo } from "react";
import {
  ShoppingBag,
  Package,
  Truck,
  Users as UsersIcon,
  ChevronRight,
  Plus,
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle2,
  ClipboardList,
  User as UserIcon,
  History,
  LayoutDashboard,
  Eye,
  EyeOff,
  Printer,
  Globe,
  Download,
  X,
  Edit3,
  CreditCard,
  FileText,
  UserPlus,
  Banknote,
  TrendingUp,
  Lock,
  Trash2,
  CalendarClock,
  BarChart3,
  Upload
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import StatCard from "@/components/ui/StatCard";

function UsersManagementView({
  users: usersList,
  onUpdateUser,
  onAddUser
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const handleOpenModal = (user) => {
    setEditingUser(user || null);
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userData = {
      name: formData.get("name"),
      email: formData.get("email"),
      role: editingUser ? editingUser.role : (formData.get("role") || "customer"),
      creditEnabled: formData.get("creditEnabled") === "true",
      creditLimit: Number(formData.get("creditLimit") || 0)
    };
    if (editingUser) {
      onUpdateUser(editingUser.id, userData);
    } else {
      const newUser = {
        ...userData,
        password: formData.get("password"),
        creditUsed: 0,
        joinDate: new Date().toISOString().split("T")[0]
      };
      onAddUser(newUser);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-col gap-4 xl:flex-row xl:items-center">
        <div className="space-y-1">
          <h1 className="text-shop-ink tracking-tight flex items-center gap-2 font-medium text-[28px]">
            <UsersIcon className="w-6 h-6 text-shop-blue" /> Gestión de Usuarios
          </h1>
          <p className="text-xs font-medium text-shop-muted font-shop">Administra el equipo y cartera de clientes minoristas/mayoristas</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-shop-ink text-white rounded-[2px] text-xs font-semibold hover:bg-shop-ink transition-all tabular-nums min-h-9"
        >
          <UserPlus className="w-4 h-4 transition-transform" /> Nuevo Usuario
        </button>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {usersList.map((user, idx) => (
          <div key={user._id || user.id || `u-${idx}`} className="bg-white border border-shop-line rounded-[2px] p-5 transition-all group relative overflow-hidden">


            <div className="flex flex-wrap items-start justify-between gap-3 relative z-10">
              <div className="flex min-w-0 items-center gap-3">
                <div className={`size-10 shrink-0 rounded-[2px] border flex items-center justify-center ${user.role === "admin" ? "bg-shop-ink text-white border-slate-900" : "bg-white text-shop-blue border-shop-line"}`}>
                  <span aria-hidden="true" className="text-sm font-medium">{(user.name || "U").split(/\s+/).slice(0, 2).map(part => part[0]).join("")}</span>
                </div>
                <div>
                  <h4 className="break-words font-medium text-shop-ink text-sm tracking-tight">{user.name}</h4>
                  <p className="break-all text-[11px] text-shop-muted tabular-nums">{user.email}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-[2px] text-[11px] font-semibold tabular-nums ${user.role === "admin" ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-shop-light text-shop-blue border border-shop-line"}`}>
                {user.role === "admin" ? "Administrador" : "Cliente"}
              </span>
            </div>
            {user.role === "customer" && (
              <button
                type="button"
                onClick={() => onUpdateUser(user.id, { isActive: user.isActive === false })}
                className={`mt-4 flex w-full items-center justify-between rounded-[2px] border px-3 py-2 text-[11px] font-semibold transition-all ${
                  user.isActive === false
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                <span>{user.isActive === false ? "Usuario desactivado" : "Usuario activo"}</span>
                <span className={`relative h-5 w-10 rounded-full ${user.isActive === false ? "bg-red-300" : "bg-emerald-500"}`}>
                  <span className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${user.isActive === false ? "left-1" : "left-6"}`} />
                </span>
              </button>
            )}

            <div className="mt-5 space-y-4 relative z-10">
              {user.role === "customer" && (
                <div className="bg-shop-light p-4 rounded-[2px] border border-shop-line space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className={`w-3.5 h-3.5 ${user.creditEnabled ? "text-emerald-600" : "text-slate-300"}`} />
                      <span className="text-[11px] font-semibold text-shop-ink tabular-nums">Línea de Crédito</span>
                    </div>
                    <button
                      aria-label={`Acceso a crédito de ${user.name}`}
                      aria-pressed={Boolean(user.creditEnabled)}
                      onClick={() => onUpdateUser(user.id, { creditEnabled: !user.creditEnabled })}
                      className={`w-8 h-4 rounded-full transition-all relative ${user.creditEnabled ? "bg-emerald-500" : "bg-slate-300"}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${user.creditEnabled ? "left-4" : "left-0.5"}`} />
                    </button>
                  </div>

                  {user.creditEnabled && (
                    <div className="space-y-2 pt-2 border-t border-shop-line">
                      <div className="flex justify-between items-baseline tabular-nums">
                        <span className="text-[11px] font-medium text-shop-muted tracking-tighter">Límite Total:</span>
                        <span className="text-xs font-semibold text-shop-ink">S/ {user.creditLimit}</span>
                      </div>
                      <div className="space-y-1 tabular-nums">
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-shop-ink rounded-full" style={{ width: `${(user.creditUsed / user.creditLimit) * 100}%` }} />
                        </div>
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span className="text-shop-blue">Usado: S/ {user.creditUsed || 0}</span>
                          <span className="text-shop-muted">Disp: S/ {user.creditLimit - (user.creditUsed || 0)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {!user.creditEnabled && (
                    <div className="text-[11px] text-shop-muted font-medium text-center py-1">
                      Este cliente no tiene acceso a ventas "A Pedido".
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-shop-muted font-medium tabular-nums">Miembro desde: {user.joinDate || "Sin fecha registrada"}</div>
                <div className="flex items-center gap-2 tabular-nums">
                  <button
                    aria-label={`Editar a ${user.name}`}
                    onClick={() => handleOpenModal(user)}
                    className="p-2 hover:bg-shop-light rounded-[2px] text-shop-muted hover:text-shop-blue transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <AdminDialog label="Datos del usuario" onClose={() => setIsModalOpen(false)} className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-shop-ink/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2px] overflow-y-auto border border-shop-line max-h-[90dvh]"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-medium text-shop-ink tracking-tight">
                      {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
                    </h3>
                    <p className="text-xs text-shop-muted font-medium mt-1 tabular-nums">
                      {editingUser ? `ID: ${editingUser.id}` : "Complete los datos"}
                    </p>
                  </div>
                  <button aria-label="Cerrar ventana" onClick={() => setIsModalOpen(false)} className="p-2 bg-shop-light text-shop-muted rounded-[2px] hover:bg-shop-light">
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-shop-muted">Nombre Completo</label>
                    <input name="name" defaultValue={editingUser?.name} required className="w-full px-4 py-3 bg-shop-light border border-shop-line rounded-[2px] outline-none focus:ring-2 focus:ring-shop-blue/20 min-h-10 min-w-0 text-base sm:text-[13px]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-shop-muted">Email</label>
                    <input name="email" type="email" defaultValue={editingUser?.email} required className="w-full px-4 py-3 bg-shop-light border border-shop-line rounded-[2px] outline-none focus:ring-2 focus:ring-shop-blue/20 min-h-10 min-w-0 text-base sm:text-[13px]" />
                  </div>
                  {!editingUser && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-shop-muted">Contraseña Inicial</label>
                      <input name="password" type="password" placeholder="Contraseña de acceso" required className="w-full px-4 py-3 bg-shop-light border border-shop-line rounded-[2px] outline-none focus:ring-2 focus:ring-shop-blue/20 min-h-10 min-w-0 text-base sm:text-[13px]" />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {editingUser ? (
                      <div>
                        <label className="text-[11px] font-semibold text-shop-muted">Rol del Usuario</label>
                        <div className={`mt-1 px-4 py-2.5 rounded-[2px] text-xs font-semibold tabular-nums flex items-center justify-between border ${
                          editingUser.role === "admin"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-shop-light text-shop-muted border-shop-line"
                        }`}>
                          <span>{editingUser.role === "admin" ? "Administrador" : "Cliente"}</span>
                          <span className="text-[11px] text-shop-muted font-shop lowercase font-normal">no editable</span>
                        </div>
                        <p className="text-[11px] text-shop-muted mt-1">
                          Los clientes no pueden ser promovidos a administradores.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <label className="text-[11px] font-semibold text-shop-muted">Rol Asignado</label>
                        <select name="role" defaultValue="customer" className="w-full mt-1 px-4 py-3 bg-shop-light border border-shop-line rounded-[2px] outline-none tabular-nums min-h-10 min-w-0 text-base sm:text-[13px]">
                          <option value="customer">Cliente</option>
                          <option value="admin">Administrador</option>
                        </select>
                        <p className="text-[11px] text-shop-muted mt-1">
                          Los administradores solo pueden ser creados por un admin o directamente en la base de datos.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-shop-light rounded-[2px] border border-shop-light space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-shop-blue" />
                        <span className="text-xs font-medium text-blue-900">Configuración de Crédito</span>
                      </div>
                      <select name="creditEnabled" defaultValue={editingUser?.creditEnabled ? "true" : "false"} className="font-medium bg-white border border-shop-line rounded-[2px] px-2 py-1 min-h-10 min-w-0 text-base sm:text-[13px]">
                        <option value="false">Deshabilitado</option>
                        <option value="true">Habilitado</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-blue-400">Límite de Crédito (S/)</label>
                      <input name="creditLimit" type="number" defaultValue={editingUser?.creditLimit || 0} className="w-full px-4 py-2 bg-white border border-shop-line rounded-[2px] outline-none tabular-nums min-h-10 min-w-0 text-base sm:text-[13px]" />
                    </div>
                  </div>

                  <button type="submit" className="w-full py-4 bg-shop-ink text-white font-semibold rounded-[2px] hover:bg-shop-ink transition-all tabular-nums">
                    {editingUser ? "Actualizar Usuario" : "Crear Usuario"}
                  </button>
                </form>
              </div>
            </motion.div>
          </AdminDialog>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UsersManagementView;

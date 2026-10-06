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
        password: formData.get("password") || "123456",
        creditUsed: 0,
        joinDate: new Date().toISOString().split("T")[0]
      };
      onAddUser(newUser);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-blue-600" /> Gestión de Usuarios
          </h2>
          <p className="text-xs font-medium text-slate-500 italic font-serif">Administra el equipo y cartera de clientes minoristas/mayoristas</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-950 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-blue-600 transition-all active:scale-95 font-mono"
        >
          <UserPlus className="w-4 h-4 hover:scale-125 transition-transform" /> Nuevo Usuario
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {usersList.map((user, idx) => (
          <div key={user._id || user.id || `u-${idx}`} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 group-hover:opacity-10 transition-opacity">
              {user.role === "admin" ? <Lock className="w-16 h-16" /> : <TrendingUp className="w-16 h-16" />}
            </div>

            <div className="flex items-start justify-between relative z-10">
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shadow-lg shadow-slate-200/50 ${user.role === "admin" ? "bg-slate-950 text-white border-slate-900" : "bg-white text-blue-600 border-slate-100"}`}>
                  <img
                    src={`https://ui-avatars.com/api/?name=${user.name}&background=${user.role === "admin" ? "0f172a" : "white"}&color=${user.role === "admin" ? "fff" : "2563eb"}`}
                    className="w-full h-full object-cover rounded-xl"
                    referrerPolicy="no-referrer"
                    alt=""
                  />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">{user.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold font-mono">{user.email}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.2em] font-mono ${user.role === "admin" ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-blue-50 text-blue-600 border border-blue-101"}`}>
                {user.role}
              </span>
            </div>

            <div className="mt-8 space-y-4 relative z-10">
              {user.role === "customer" && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 animate-pulse">
                      <CreditCard className={`w-3.5 h-3.5 ${user.creditEnabled ? "text-emerald-600" : "text-slate-300"}`} />
                      <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest font-mono">Línea de Crédito</span>
                    </div>
                    <button
                      onClick={() => onUpdateUser(user.id, { creditEnabled: !user.creditEnabled })}
                      className={`w-8 h-4 rounded-full transition-all relative ${user.creditEnabled ? "bg-emerald-500" : "bg-slate-300"}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${user.creditEnabled ? "left-4" : "left-0.5"}`} />
                    </button>
                  </div>
                  
                  {user.creditEnabled && (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div className="flex justify-between items-baseline font-mono">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Límite Total:</span>
                        <span className="text-xs font-black text-slate-900">S/ {user.creditLimit}</span>
                      </div>
                      <div className="space-y-1 font-mono">
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(user.creditUsed / user.creditLimit) * 100}%` }} />
                        </div>
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                          <span className="text-blue-600">Usado: S/ {user.creditUsed || 0}</span>
                          <span className="text-slate-400">Disp: S/ {user.creditLimit - (user.creditUsed || 0)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {!user.creditEnabled && (
                    <div className="text-[10px] text-slate-400 font-medium italic text-center py-1">
                      Este cliente no tiene acceso a ventas "A Pedido".
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">Miembro desde: {user.joinDate}</div>
                <div className="flex items-center gap-2 font-mono">
                  <button
                    onClick={() => handleOpenModal(user)}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
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
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                      {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
                    </h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 font-mono">
                      {editingUser ? `ID: ${editingUser.id}` : "Complete los datos"}
                    </p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100">
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre Completo</label>
                    <input name="name" defaultValue={editingUser?.name} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 shadow-inner" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</label>
                    <input name="email" type="email" defaultValue={editingUser?.email} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 shadow-inner" />
                  </div>
                  {!editingUser && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contraseña Inicial</label>
                      <input name="password" type="password" placeholder="Contraseña de acceso" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 shadow-inner" />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {editingUser ? (
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rol del Usuario</label>
                        <div className={`mt-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider font-mono flex items-center justify-between border ${
                          editingUser.role === "admin" 
                            ? "bg-rose-50 text-rose-700 border-rose-200" 
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                          <span>{editingUser.role === "admin" ? "Administrador" : "Cliente"}</span>
                          <span className="text-[9px] text-slate-400 font-sans lowercase italic font-normal">no editable</span>
                        </div>
                        <p className="text-[9px] text-slate-400 italic mt-1">
                          Los clientes no pueden ser promovidos a administradores.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rol Asignado</label>
                        <select name="role" defaultValue="customer" className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-mono">
                          <option value="customer">Cliente</option>
                          <option value="admin">Administrador</option>
                        </select>
                        <p className="text-[9px] text-slate-400 italic mt-1">
                          Los administradores solo pueden ser creados por un admin o directamente en la base de datos.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-blue-900">Configuración de Crédito</span>
                      </div>
                      <select name="creditEnabled" defaultValue={editingUser?.creditEnabled ? "true" : "false"} className="text-[10px] font-bold bg-white border border-blue-200 rounded px-2 py-1">
                        <option value="false">Deshabilitado</option>
                        <option value="true">Habilitado</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Límite de Crédito (S/)</label>
                      <input name="creditLimit" type="number" defaultValue={editingUser?.creditLimit || 0} className="w-full px-4 py-2 bg-white border border-blue-200 rounded-xl text-sm outline-none font-mono" />
                    </div>
                  </div>

                  <button type="submit" className="w-full py-4 bg-slate-950 text-white font-black uppercase tracking-widest rounded-xl shadow-xl hover:bg-blue-600 transition-all active:scale-95 font-mono">
                    {editingUser ? "Actualizar Usuario" : "Crear Usuario"}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UsersManagementView;

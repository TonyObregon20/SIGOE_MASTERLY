import React from "react";
import { User, Mail, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../hooks/useAuth";
import { getUsersApi } from "@/features/users/usersApi";
import logoImg from "@/assets/images/logoMasterly.png";

function AuthModal({
  isOpen,
  onClose,
  loginMode,
  setLoginMode,
  setUsers,
  setView
}) {
  const { login, register } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");
    const name = formData.get("name");

    try {
      const data = loginMode === "login"
        ? await login(email, password)
        : await register(name, email, password);

      if (data.success) {
        onClose();

        // Refetch users list if setUsers provided
        if (typeof setUsers === "function") {
          const uList = await getUsersApi();
          if (Array.isArray(uList)) setUsers(uList);
        }

        if (data.user?.role === "admin") {
          setView("admin");
        } else {
          setView("store");
        }
      } else {
        alert(data.message || "Error al autenticar");
      }
    } catch (err) {
      console.error("Auth error:", err);
      alert("Error de conexión con el servidor");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
        >
          <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600" />
          <div className="p-10 space-y-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-22 h-22 bg-white rounded-2xl flex items-center justify-center border border-slate-200 shadow-md overflow-hidden">
                <img
                  src={logoImg}
                  alt="Masterly"
                  className="w-full h-full object-contain scale-[1.35]"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = "https://ui-avatars.com/api/?name=M&background=0f172a&color=fff";
                  }}
                />
              </div>
              <div>
                <h2 className="text-3xl font-serif italic font-black text-slate-950 tracking-tight">
                  {loginMode === "login" ? "Bienvenido" : "Crear Cuenta"}
                </h2>
                <p className="text-slate-550 text-sm font-medium mt-1">
                  {loginMode === "login" ? "Acceda a su terminal administrativa" : "Únete a la excelencia en vestimenta"}
                </p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {loginMode === "register" && (
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Nombre Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="name"
                      type="text"
                      placeholder="Juan Pérez"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 font-mono">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="email"
                    type="email"
                    placeholder="ejemplo@correo.com"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 font-mono">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="password"
                    type="password"
                    placeholder="Tu contraseña"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-slate-950 text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-slate-900/20 hover:bg-blue-600 transition-all active:scale-95 text-xs font-mono"
              >
                {loginMode === "login" ? "Ingresar" : "Registrarme"}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setLoginMode(loginMode === "login" ? "register" : "login")}
                  className="text-[10px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-[0.1em] font-mono"
                >
                  {loginMode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia Sesión"}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default AuthModal;

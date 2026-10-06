import React from "react";
import { User, FileText, ShoppingBag } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCart } from "@/features/cart/hooks/useCart";
import logoImg from "@/assets/images/logoMasterly.png";

function Navbar({
  view,
  setView,
  setIsLoginOpen,
  setIsMyOrdersOpen
}) {
  const { isLoggedIn, currentUser, logout } = useAuth();
  const { cart, openCart } = useCart();

  const handleLogout = () => {
    logout();
    setView("store");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView("store")}>
          <div className="w-13 h-13 bg-white rounded-xl flex items-center justify-center shadow-md shadow-blue-500/5 border border-slate-200/80 overflow-hidden">
            <img
              src={logoImg}
              alt="Masterly Logo"
              className="w-full h-full object-contain scale-[1.35] transition-transform duration-300 hover:scale-[1.45]"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = "https://ui-avatars.com/api/?name=M&background=0f172a&color=fff";
              }}
            />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tighter leading-none text-slate-950 flex items-center gap-2">
              MASTERLY
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em] font-black text-blue-600">
              Línea de Vestir ideal para ti
            </span>
          </div>
        </div>
        
        {/* Navigation Items */}
        <div className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => setView("store")} 
            className={`text-sm font-black uppercase tracking-widest transition-all ${view === "store" ? "text-blue-600 border-b-2 border-blue-600 pb-1" : "text-slate-500 hover:text-slate-900 pb-1 border-b-2 border-transparent"}`}
          >
            Inicio
          </button>
          <button 
            onClick={() => setView("products")} 
            className={`text-sm font-black uppercase tracking-widest transition-all ${view === "products" ? "text-blue-600 border-b-2 border-blue-600 pb-1" : "text-slate-500 hover:text-slate-900 pb-1 border-b-2 border-transparent"}`}
          >
            Productos
          </button>
          {isLoggedIn && currentUser?.creditEnabled && (
            <button 
              onClick={() => setView("pedido")} 
              className={`text-sm font-black uppercase tracking-widest transition-all ${view === "pedido" ? "text-blue-600 border-b-2 border-blue-600 pb-1" : "text-slate-500 hover:text-slate-900 pb-1 border-b-2 border-transparent"}`}
            >
              A Pedido
            </button>
          )}
          <button 
            onClick={() => setView("collections")} 
            className={`text-sm font-black uppercase tracking-widest transition-all ${view === "collections" ? "text-blue-600 border-b-2 border-blue-600 pb-1" : "text-slate-500 hover:text-slate-900 pb-1 border-b-2 border-transparent"}`}
          >
            Colecciones
          </button>
          <button 
            onClick={() => setView("about")} 
            className={`text-sm font-black uppercase tracking-widest transition-all ${view === "about" ? "text-blue-600 border-b-2 border-blue-600 pb-1" : "text-slate-500 hover:text-slate-900 pb-1 border-b-2 border-transparent"}`}
          >
            Sobre Nosotros
          </button>
          
          <div className="w-px h-4 bg-slate-200" />
          
          {!isLoggedIn ? (
            <button
              onClick={() => setIsLoginOpen(true)}
              className="px-5 py-2 bg-slate-950 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all hover:bg-blue-600 shadow-xl shadow-slate-900/10 active:scale-95 flex items-center gap-2"
            >
              <User className="w-3 h-3" /> Iniciar Sesión
            </button>
          ) : (
            <>
              {currentUser?.role === "admin" && (
                <button
                  onClick={() => setView(view === "admin" ? "store" : "admin")}
                  className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${view === "admin" ? "bg-blue-600 text-white shadow-lg" : "bg-slate-100 text-slate-900 hover:bg-slate-200"}`}
                >
                  Panel {view === "admin" ? "Tienda" : "Admin"}
                </button>
              )}
              <button
                onClick={() => setIsMyOrdersOpen(true)}
                className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 font-mono shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Mis Comprobantes</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-5 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cerrar Sesión
              </button>
            </>
          )}
        </div>

        {/* Right Section: Shopping Cart & User Avatar */}
        <div className="flex items-center gap-6">
          {(view === "store" || view === "products" || view === "pedido") && (
            <div className="relative group">
              <button
                onClick={openCart}
                className="relative p-2.5 text-slate-900 bg-white rounded-full border border-slate-100 shadow-sm transition-all hover:border-blue-500 hover:text-blue-600"
              >
                <ShoppingBag className="w-5 h-5" />
                {cart.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-lg"
                  >
                    {cart.reduce((acc, i) => acc + i.quantity, 0)}
                  </motion.span>
                )}
              </button>
            </div>
          )}
          <div className="w-10 h-10 rounded-xl bg-slate-100 p-0.5 border border-slate-200">
            <img 
              className="w-full h-full rounded-[10px] object-cover" 
              src={isLoggedIn 
                ? currentUser?.role === "admin" 
                  ? "https://ui-avatars.com/api/?name=Admin+User&background=0f172a&color=fff" 
                  : "https://ui-avatars.com/api/?name=Cliente+VIP&background=0284c7&color=fff" 
                : "https://ui-avatars.com/api/?name=Invitado&background=cbd5e1&color=fff"
              } 
              alt="User" 
              referrerPolicy="no-referrer" 
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

import React, { useState, useMemo } from "react";
import { Truck, CheckCircle2, History, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import StoreProductCard from "@/features/products/components/StoreProductCard";

function StorePage({ products, addToCart, isLoggedIn, currentUser, setView }) {
  const [filter, setFilter] = useState("Todos");

  const filteredProducts = useMemo(() => {
    const publicProducts = products.filter((p) => p.isPublic !== false);
    if (filter === "Todos") return publicProducts;
    return publicProducts.filter((p) => p.category === filter);
  }, [filter, products]);

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative -mx-4 -mt-8 h-[600px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=1920"
          alt="Hero Camisa"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/40 to-transparent flex items-center">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-xl space-y-6"
            >
              <div className="inline-block px-4 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-sm">
                Colección 2024
              </div>
              <h1 className="text-7xl font-serif italic font-black text-white leading-[1.1] tracking-tight">
                La Elegancia <br />
                <span className="text-blue-500">Redefinida.</span>
              </h1>
              <p className="text-lg text-slate-300 font-medium italic border-l-2 border-blue-500 pl-6 leading-relaxed">
                Descubre nuestra línea exclusiva de camisas artesanales, diseñadas para quienes valoran la precisión y el estilo eterno.
              </p>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setView("products")}
                  className="px-8 py-4 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition-all active:scale-95 shadow-xl"
                >
                  Comprar Ahora
                </button>
                <button
                  onClick={() => setView("products")}
                  className="px-8 py-4 bg-transparent border-2 border-white/30 text-white font-bold rounded-lg hover:border-white transition-all active:scale-95"
                >
                  Ver Catálogo
                </button>
              </div>
            </motion.div>
          </div>
        </div>
        {/* Geometric Accents */}
        <div className="absolute bottom-0 right-0 w-1/3 h-full bg-blue-600 skew-x-[-20deg] translate-x-1/2 opacity-10" />
      </section>

      {/* Featured Categories */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8">
          <motion.div
            onClick={() => setView("products")}
            whileHover={{ y: -5 }}
            className="flex-1 h-64 bg-slate-900 rounded-2xl relative overflow-hidden group cursor-pointer border-t-4 border-blue-500 shadow-xl"
          >
            <img
              src="https://images.unsplash.com/photo-1593032465175-481ac7f402a1?q=80&w=1000&auto=format&fit=crop"
              className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-110 transition-transform duration-700"
              referrerPolicy="no-referrer"
              alt="Línea Formal"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
            <div className="relative h-full flex flex-col justify-end p-8">
              <h3 className="text-2xl font-serif italic font-bold text-white mb-1">Línea Formal</h3>
              <p className="text-slate-300 text-sm font-medium">Precisión para el éxito.</p>
            </div>
          </motion.div>
          <motion.div
            onClick={() => setView("products")}
            whileHover={{ y: -5 }}
            className="flex-1 h-64 bg-slate-100 rounded-2xl relative overflow-hidden group cursor-pointer border-t-4 border-indigo-500 shadow-xl"
          >
            <img
              src="https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1000&auto=format&fit=crop"
              className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-110 transition-transform duration-700"
              referrerPolicy="no-referrer"
              alt="Estilo Casual"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
            <div className="relative h-full flex flex-col justify-end p-8">
              <h3 className="text-2xl font-serif italic font-bold text-white mb-1">Estilo Casual</h3>
              <p className="text-slate-150 text-sm font-bold">Libertad con elegancia.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section className="max-w-7xl mx-auto px-4 space-y-12">
        <div className="flex flex-col md:flex-row items-end justify-between gap-6 border-b border-slate-200 pb-8">
          <div className="space-y-2">
            <h2 className="text-4xl font-serif italic font-black text-slate-900 tracking-tight">
              Nuestras Piezas {isLoggedIn && currentUser?.creditEnabled && (
                <span className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded-full uppercase tracking-widest translate-y-[-10px] ml-2 inline-block">
                  Modo Pedido
                </span>
              )}
            </h2>
            <p className="text-slate-500 font-medium">Seleccionadas cuidadosamente para tu estilo único.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Todos", "Formal", "Casual", "Exterior"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  filter === cat 
                    ? "bg-slate-900 text-white shadow-lg" 
                    : "bg-white border border-slate-200 text-slate-500 hover:border-slate-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={product._id || product.id || `p-${idx}`}
              >
                <StoreProductCard
                  product={product}
                  addToCart={addToCart}
                  isLoggedIn={isLoggedIn}
                  currentUser={currentUser}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-slate-900 py-16 -mx-4 px-4 overflow-hidden relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
          <div className="flex items-center gap-4 text-white">
            <div className="w-12 h-12 bg-white/10 flex items-center justify-center rounded-xl border border-white/20">
              <Truck className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h4 className="font-bold text-lg italic font-serif leading-none">Envío Express</h4>
              <p className="text-slate-400 text-xs mt-1">Todo el país en 24-48h.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-white">
            <div className="w-12 h-12 bg-white/10 flex items-center justify-center rounded-xl border border-white/20">
              <CheckCircle2 className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h4 className="font-bold text-lg italic font-serif leading-none">Calidad Premium</h4>
              <p className="text-slate-400 text-xs mt-1">Materiales certificados.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-white">
            <div className="w-12 h-12 bg-white/10 flex items-center justify-center rounded-xl border border-white/20">
              <History className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-bold text-lg italic font-serif leading-none">Garantía Total</h4>
              <p className="text-slate-400 text-xs mt-1">30 días para devoluciones.</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 blur-[120px] opacity-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500 blur-[120px] opacity-20" />
      </section>
    </div>
  );
}

export default StorePage;

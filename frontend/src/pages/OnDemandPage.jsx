import React, { useState, useMemo } from "react";
import { Search, Filter, CalendarClock, Banknote } from "lucide-react";
import { AnimatePresence } from "motion/react";
import OnDemandProductCard from "@/features/products/components/OnDemandProductCard";

function OnDemandPage({ products, addToCart, isLoggedIn, currentUser }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [batchSize, setBatchSize] = useState(10);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => p.isPublic !== false).filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "Todos" || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-16 min-h-screen">
      {/* On-Demand Intro Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 blur-[120px] rounded-full" />
        
        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-3 bg-blue-500/25 border border-blue-400/30 px-3 py-1.5 rounded-full">
            <CalendarClock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-300">Fabricación Directa Garantizada</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-serif italic font-black tracking-tight leading-tight">
            Programa de <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 text-blue-400">Manufactura Mayorista y Personalizada</span>
          </h1>
          
          <p className="text-slate-300 text-sm md:text-base font-medium leading-relaxed max-w-2xl font-serif">
            ¿Buscas stock personalizado o necesitas lotes de camisas sin limitaciones de inventario? 
            Con nuestro sistema <strong className="text-white font-bold">"A Pedido"</strong>, fabricamos directamente tus diseños elegidos con un adelanto del 50%. Ideal para tiendas, empresas u ocasiones especiales.
          </p>

          {/* Interactive Lot Specs Calculator */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-white/10 font-mono">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium font-sans">Financiamiento Flexible</span>
              <p className="text-sm font-black text-white">50% Adelanto, saldo contra entrega</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium font-sans">Tiempo Estimado</span>
              <p className="text-sm font-black text-blue-400 text-[11px]">14 días calendario</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium font-sans">Seguimiento Digital</span>
              <p className="text-sm font-black text-emerald-400 font-mono">Etapas de confección en vivo</p>
            </div>
          </div>

          {/* User Credit Line Status Card */}
          {isLoggedIn && currentUser?.creditEnabled ? (
            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-indigo-500/20 border border-emerald-400/40 backdrop-blur-md space-y-3 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/25 border border-emerald-400/40 text-emerald-300">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 font-mono">
                        Línea de Crédito Activa
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                        Cliente VIP B2B
                      </span>
                    </div>
                    <p className="text-2xl font-black text-white font-mono tracking-tight mt-0.5">
                      S/ {((currentUser.creditLimit || 0) - (currentUser.creditUsed || 0)).toLocaleString()}{" "}
                      <span className="text-xs font-normal text-slate-300 font-sans">disponible</span>
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right font-mono text-xs text-slate-300 space-y-1 bg-black/30 p-2.5 rounded-xl border border-white/10">
                  <div className="flex justify-between sm:justify-end gap-3 text-[11px]">
                    <span className="text-slate-400">Límite Aprobado:</span>
                    <strong className="text-white">S/ {(currentUser.creditLimit || 0).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between sm:justify-end gap-3 text-[11px]">
                    <span className="text-slate-400">Crédito Utilizado:</span>
                    <strong className="text-amber-300">S/ {(currentUser.creditUsed || 0).toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Progress Bar for Credit Usage */}
              <div className="space-y-1">
                <div className="w-full bg-slate-900/80 rounded-full h-2 overflow-hidden border border-white/10 p-0.5">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-blue-400 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          (((currentUser.creditUsed || 0) / (currentUser.creditLimit || 1)) * 100)
                        )
                      )}%`
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-300 font-sans">
                  <span>Financia tus pedidos "A Pedido" utilizando tu línea de crédito empresarial.</span>
                  <span className="font-mono font-bold text-emerald-300">
                    {(
                      100 -
                      ((currentUser.creditUsed || 0) / (currentUser.creditLimit || 1)) * 100
                    ).toFixed(0)}
                    % libre
                  </span>
                </div>
              </div>
            </div>
          ) : isLoggedIn ? (
            <div className="mt-4 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center justify-between gap-2 font-sans">
              <span>¿Eres cliente mayorista? Puedes solicitar una línea de crédito B2B para tus pedidos.</span>
              <span className="text-[10px] font-bold text-blue-300 bg-blue-500/20 px-2.5 py-1 rounded-lg border border-blue-400/30 font-mono uppercase">
                Consulte con Administración
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Catalog & Search */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-3xl font-serif italic font-black text-slate-900 tracking-tight">
              Prendas Disponibles para Fabricación
            </h2>
            <p className="text-slate-500 font-medium font-mono text-[10px] uppercase tracking-widest mt-1">
              Haz tu solicitud de producción para cualquiera de nuestras camisas premium
            </p>
          </div>
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar modelos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 font-medium transition-all shadow-sm focus:bg-white"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar filters */}
          <aside className="w-full lg:w-72 space-y-8 sticky top-24 h-fit">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-black text-[10px] uppercase tracking-[0.2em]">
                <Filter className="w-3 h-3" />
                <span>Modelos</span>
              </div>
              <div className="flex flex-wrap lg:flex-col gap-2">
                {["Todos", "Formal", "Casual", "Exterior"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-4 py-2 text-left rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                      categoryFilter === cat 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                        : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Lot Size Interactive Widget */}
            <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-widest">
                <Banknote className="w-4 h-4 text-blue-600" />
                <span>Simulador de Lote</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed font-sans">
                Aumenta la cantidad para proyectar el costo de fabricación por volumen ideal para tu negocio.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs font-bold text-slate-700">
                  <span>Cant. Proyectada:</span>
                  <span className="text-blue-600 font-bold">{batchSize} piezas</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
              <div className="pt-3 border-t border-slate-200 space-y-1.5 text-[10px] font-bold text-slate-500 font-mono">
                <div className="flex justify-between">
                  <span>Costo Estimado:</span>
                  <span className="text-slate-900">S/ {(batchSize * 150).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-blue-600 font-black">
                  <span>Adelanto del 50%:</span>
                  <span>S/ {(batchSize * 150 * 0.5).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Catalog grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <OnDemandProductCard
                    key={product.id}
                    product={product}
                    addToCart={addToCart}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnDemandPage;

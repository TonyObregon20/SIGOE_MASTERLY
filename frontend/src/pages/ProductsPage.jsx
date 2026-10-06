import React, { useState, useMemo } from "react";
import { Search, Filter } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import StoreProductCard from "@/features/products/components/StoreProductCard";

function ProductsPage({ products, addToCart, isLoggedIn, currentUser }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [priceRange, setPriceRange] = useState([0, 300]);
  const [sortBy, setSortBy] = useState("featured");

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => p.isPublic !== false)
      .filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              p.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === "Todos" || p.category === categoryFilter;
        const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
        return matchesSearch && matchesCategory && matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        return 0; // Default featured sort
      });
  }, [products, searchQuery, categoryFilter, priceRange, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12 min-h-screen">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-4xl font-serif italic font-black text-slate-900 tracking-tight">
            Nuestro Catálogo
          </h2>
          <p className="text-slate-500 font-medium font-mono text-[10px] uppercase tracking-widest mt-1">
            {filteredProducts.length} productos encontrados
          </p>
        </div>
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Buscar camisas, texturas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 font-medium transition-all shadow-sm focus:bg-white"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Filters Sidebar */}
        <aside className="w-full lg:w-72 space-y-8 sticky top-24 h-fit">
          {/* Categories */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-black text-[10px] uppercase tracking-[0.2em]">
              <Filter className="w-3 h-3" />
              <span>Categorías</span>
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

          {/* Price Range */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-slate-900 font-black text-[10px] uppercase tracking-[0.2em]">
              <span>Rango de Precio</span>
              <span className="text-blue-600 font-mono">S/ {priceRange[0]} - S/ {priceRange[1]}</span>
            </div>
            <input
              type="range"
              min="0"
              max="300"
              step="10"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] font-bold text-slate-400 font-mono">
              <span>S/ 0</span>
              <span>S/ 300</span>
            </div>
          </div>

          {/* Sort By */}
          <div className="space-y-4">
            <div className="text-slate-900 font-black text-[10px] uppercase tracking-[0.2em]">
              <span>Ordenar Por</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full p-3 bg-white border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-blue-500/20 outline-none"
            >
              <option value="featured">Destacados</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
            </select>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <div>
                <h3 className="text-xl font-serif italic font-bold text-slate-900">No encontramos resultados</h3>
                <p className="text-slate-500 text-sm mt-2">Intenta ajustar los filtros de búsqueda.</p>
              </div>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("Todos");
                  setPriceRange([0, 300]);
                }}
                className="text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] hover:underline"
              >
                Limpiar todo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, idx) => (
                  <motion.div
                    key={product._id || product.id || `p-${idx}`}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
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
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductsPage;

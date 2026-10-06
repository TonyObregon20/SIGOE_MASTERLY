import React from "react";
import { ChevronRight, Quote } from "lucide-react";
import { motion } from "motion/react";

function CollectionsPage({ products, addToCart }) {
  const collections = [
    {
      name: "Línea Formal",
      subtitle: "La precisión del detalle en cada costura.",
      image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=1200",
      category: "Formal",
      color: "blue",
      letter: "F"
    },
    {
      name: "Estilo Casual",
      subtitle: "Comodidad elevada para el día a día.",
      image: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&q=80&w=1200",
      category: "Casual",
      color: "indigo",
      letter: "C"
    },
    {
      name: "Outerwear",
      subtitle: "Protección con un corte impecable.",
      image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=1200",
      category: "Exterior",
      color: "emerald",
      letter: "O"
    }
  ];

  return (
    <div className="relative space-y-48 pb-40 overflow-hidden bg-white">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="sticky top-0 h-screen flex flex-col justify-between p-20 opacity-[0.02] select-none text-slate-900">
          <span className="text-[25vw] font-serif italic font-black leading-none -ml-20">MASTERLY</span>
          <span className="text-[25vw] font-serif italic font-black leading-none self-end -mr-20 font-serif">HERITAGE</span>
        </div>
      </div>

      {/* Header */}
      <section className="relative text-center space-y-4 pt-20">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-4 mb-4">
            <div className="w-12 h-px bg-blue-600" />
            <span className="text-[11px] font-black uppercase tracking-[0.6em] text-blue-600">The Editorial Edit</span>
            <div className="w-12 h-px bg-blue-600" />
          </div>
          <h1 className="text-7xl md:text-8xl font-serif italic font-black text-slate-900 tracking-tight leading-none">
            Colecciones <br /> 
            <span className="text-slate-300 font-serif">Edition 2024.</span>
          </h1>
        </motion.div>
      </section>

      {/* Collection Grid */}
      <div className="relative space-y-64 max-w-6xl mx-auto px-4">
        {collections.map((col, idx) => (
          <section key={col.name} className={`flex flex-col ${idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} gap-12 lg:gap-24 items-center`}>
            {/* Visual Part */}
            <div className="flex-1 relative w-full group">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="relative z-10 aspect-[3/4] rounded shadow-2xl overflow-hidden bg-slate-100"
              >
                <img
                  src={col.image}
                  alt={col.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3s] ease-out opacity-0"
                  onLoad={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-slate-900/10 mix-blend-multiply group-hover:opacity-0 transition-opacity" />
              </motion.div>
              
              {/* Floating Letter Accent */}
              <div className={`absolute -top-10 ${idx % 2 === 0 ? "-right-10" : "-left-10"} text-[12rem] font-serif italic font-black text-slate-900 opacity-[0.03] select-none z-0`}>
                {col.letter}
              </div>

              {/* Minimal Tag */}
              <div className={`absolute ${idx % 2 === 0 ? "-left-6 top-1/2" : "-right-6 top-1/2"} -translate-y-1/2 bg-white px-4 py-8 shadow-xl border border-slate-100 z-20 flex flex-col items-center gap-4`}>
                <div className="w-px h-8 bg-slate-300" />
                <span className="text-[8px] font-black uppercase tracking-[0.4em] rotate-90 whitespace-nowrap text-slate-400">Masterly Series</span>
              </div>
            </div>
            
            {/* Context Part */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="flex-1 space-y-10"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-px bg-blue-600 animate-pulse" />
                  <span className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-900">{col.category} Series</span>
                </div>
                <h2 className="text-5xl md:text-6xl font-serif italic font-black text-slate-900 leading-tight">{col.name}</h2>
                <p className="text-xl text-slate-500 font-medium italic leading-relaxed max-w-md">{col.subtitle}</p>
              </div>
              
              {/* Featured Selection */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                   Featured Pieces
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  {products.filter((p) => p.category === col.category || p.category === "Formal").slice(0, 2).map((p) => (
                    <div key={p.id} className="group cursor-pointer" onClick={() => addToCart(p, 1, "M")}>
                      <div className="relative aspect-[4/5] rounded bg-slate-100 border border-slate-100 overflow-hidden">
                        <img
                          src={p.image}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          alt={p.name}
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors" />
                        <div className="absolute bottom-3 inset-x-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                          <button className="w-full bg-white text-slate-900 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] shadow-lg">
                            Seleccionar
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between items-start">
                        <p className="text-[11px] font-bold text-slate-800 line-clamp-1">{p.name}</p>
                        <p className="text-[10px] font-black text-slate-400 ml-2">S/{p.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button className="inline-flex items-center gap-4 py-3.5 px-6 border border-slate-200 hover:border-slate-800 hover:bg-slate-900 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.3em] group">
                  Explorar Catálogo <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </button>
              </div>
            </motion.div>
          </section>
        ))}
      </div>

      {/* Seasonal Quote */}
      <section className="max-w-4xl mx-auto text-center py-20">
        <div className="space-y-6">
          <Quote className="w-12 h-12 text-slate-200 mx-auto" />
          <p className="text-4xl font-serif italic font-black text-slate-400 leading-tight">
            "La sastrería es una forma de arquitectura, donde la proporción y el material definen la silueta del carácter."
          </p>
          <div className="w-12 h-px bg-slate-300 mx-auto mt-10" />
        </div>
      </section>
    </div>
  );
}

export default CollectionsPage;

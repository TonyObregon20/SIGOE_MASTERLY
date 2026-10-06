import React, { useState } from "react";
import { Plus, Clock } from "lucide-react";
import { motion } from "motion/react";

function OnDemandProductCard({
  product,
  addToCart
}) {
  const [qty, setQty] = useState(10);
  const [sizes, setSizes] = useState({ S: 2, M: 3, L: 3, XL: 2 });

  const syncSizesWithTotal = (total) => {
    const S = Math.round(total * 0.2);
    const M = Math.round(total * 0.3);
    const L = Math.round(total * 0.3);
    const XL = total - S - M - L;
    setSizes({ S, M, L, XL: Math.max(0, XL) });
  };

  const handleTotalQtyChange = (newTotal) => {
    const finalTotal = Math.max(1, newTotal);
    setQty(finalTotal);
    syncSizesWithTotal(finalTotal);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 flex flex-col justify-between"
    >
      <div className="aspect-[4/5] relative overflow-hidden bg-slate-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="absolute top-4 left-4">
          <div className="px-2 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[8px] font-black uppercase tracking-widest rounded-sm shadow-lg border border-blue-400">
            A Fabricar (50% Adelanto)
          </div>
        </div>

        <button
          onClick={() => addToCart(product, qty, undefined, sizes)}
          className="absolute bottom-4 left-4 right-4 py-3 bg-white/95 backdrop-blur-sm text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] rounded-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-blue-600 hover:text-white flex items-center justify-center gap-1.5 shadow-md font-sans"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar
        </button>
      </div>

      <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-with-spacing tracking-[0.2em]">{product.category}</span>
              <span className="text-sm font-black text-slate-950">S/ {product.price}</span>
            </div>
            <h3 className="font-bold text-slate-800 text-base tracking-tight line-clamp-1">{product.name}</h3>
            <p className="text-[10px] text-slate-400 font-medium line-clamp-2 leading-relaxed">{product.description}</p>
          </div>
          
          {/* Interactive Quantity Selector inside card */}
          <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Cantidad Lote</span>
              <span className="text-[10px] font-mono font-bold text-blue-600">{qty} unidades</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleTotalQtyChange(qty - 1)}
                className="w-7 h-7 rounded-md bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center text-xs"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  handleTotalQtyChange(isNaN(val) ? 10 : val);
                }}
                className="flex-1 text-center bg-white border border-slate-200 rounded-md h-7 text-xs font-mono font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={() => handleTotalQtyChange(qty + 1)}
                className="w-7 h-7 rounded-md bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center text-xs"
              >
                +
              </button>
            </div>

            {/* Custom Sizes Distribution Sub-grid and steppers */}
            <div className="pt-2 border-t border-slate-200/60 mt-2 space-y-1.5">
              <span className="block text-[8px] font-bold uppercase tracking-widest text-slate-400">Distribución de Tallas (Personalizar)</span>
              <div className="grid grid-cols-4 gap-1">
                {["S", "M", "L", "XL"].map((sz) => (
                  <div key={sz} className="flex flex-col items-center bg-white p-1 rounded-lg border border-slate-100">
                    <span className="text-[9px] font-black text-slate-500 font-mono">{sz}</span>
                    <input
                      type="number"
                      min="0"
                      value={sizes[sz] || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        const sizeVal = isNaN(val) ? 0 : Math.max(0, val);
                        const updatedSizes = { ...sizes, [sz]: sizeVal };
                        setSizes(updatedSizes);
                        const total = Object.values(updatedSizes).reduce((acc, curr) => acc + curr, 0);
                        setQty(total);
                      }}
                      className="w-full text-center bg-slate-50 rounded text-[10px] font-mono font-bold h-5 mt-0.5 outline-none focus:bg-blue-50 focus:text-blue-600 border border-transparent focus:border-blue-200"
                    />
                    <div className="flex gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const current = sizes[sz] || 0;
                          const sizeVal = Math.max(0, current - 1);
                          const updatedSizes = { ...sizes, [sz]: sizeVal };
                          setSizes(updatedSizes);
                          const total = Object.values(updatedSizes).reduce((acc, curr) => acc + curr, 0);
                          setQty(total);
                        }}
                        className="w-3.5 h-3 flex items-center justify-center text-[8px] font-black bg-slate-50 border border-slate-200 text-slate-500 rounded hover:bg-slate-100 active:scale-95"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const current = sizes[sz] || 0;
                          const sizeVal = current + 1;
                          const updatedSizes = { ...sizes, [sz]: sizeVal };
                          setSizes(updatedSizes);
                          const total = Object.values(updatedSizes).reduce((acc, curr) => acc + curr, 0);
                          setQty(total);
                        }}
                        className="w-3.5 h-3 flex items-center justify-center text-[8px] font-black bg-slate-50 border border-slate-200 text-slate-500 rounded hover:bg-slate-100 active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>14 Días laborables</span>
          </div>
          <span className="text-emerald-600 font-black">Adelanto 50%</span>
        </div>
      </div>
    </motion.div>
  );
}

export default OnDemandProductCard;

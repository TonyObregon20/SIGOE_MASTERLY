import React, { useState } from "react";
import { ShoppingBag, Upload, X, Layers } from "lucide-react";
import { motion } from "motion/react";

/**
 * Modal to register a new product in the catalog with breakdown per size (S, M, L, XL)
 */
export default function AddProductModal({ isOpen, onClose, onAddProduct, onOpenGallery }) {
  const [form, setForm] = useState({
    name: "",
    category: "Casual",
    price: 90,
    description: "",
    image: "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=800",
    minStock: 10
  });

  const [sizes, setSizes] = useState({
    S: 12,
    M: 15,
    L: 13,
    XL: 10
  });

  if (!isOpen) return null;

  const totalPhysical = Object.values(sizes).reduce((sum, v) => sum + (Math.max(0, Number(v)) || 0), 0);

  const handleSizeChange = (sizeKey, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setSizes((prev) => ({
      ...prev,
      [sizeKey]: num
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const formattedSizes = {
      S: { stockPhysical: Number(sizes.S) || 0, stockCommitted: 0 },
      M: { stockPhysical: Number(sizes.M) || 0, stockCommitted: 0 },
      L: { stockPhysical: Number(sizes.L) || 0, stockCommitted: 0 },
      XL: { stockPhysical: Number(sizes.XL) || 0, stockCommitted: 0 }
    };

    onAddProduct({
      ...form,
      price: Number(form.price),
      minStock: Number(form.minStock),
      isPublic: true,
      stockPhysical: totalPhysical,
      stockCommitted: 0,
      sizes: formattedSizes
    });

    // Reset and close
    setForm({
      name: "",
      category: "Casual",
      price: 90,
      description: "",
      image: "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=800",
      minStock: 10
    });
    setSizes({ S: 12, M: 15, L: 13, XL: 10 });
    onClose();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setForm((prev) => ({ ...prev, image: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">
              Nuevo Producto / Prenda con Tallas
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                Nombre de la Prenda
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Camisa Slim Fit Algodón"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                Categoría
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="Formal">Formal</option>
                <option value="Casual">Casual</option>
                <option value="Exterior">Exterior</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                Precio Web (S/)
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
              />
            </div>

            {/* Sizes Stock Grid */}
            <div className="col-span-2 bg-blue-50/50 p-3.5 rounded-xl border border-blue-150 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-blue-900 flex items-center gap-1.5 font-mono">
                  <Layers className="w-3.5 h-3.5 text-blue-600" /> Cantidades Iniciales por Talla:
                </label>
                <span className="text-[10px] font-black font-mono bg-blue-600 text-white px-2 py-0.5 rounded shadow-xs">
                  Total: {totalPhysical} prendas
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1">
                {["S", "M", "L", "XL"].map((sz) => (
                  <div key={sz} className="bg-white p-2 rounded-lg border border-slate-200 text-center shadow-xs">
                    <span className="text-[10px] font-black font-mono text-slate-700 block mb-1">
                      Talla {sz}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={sizes[sz] !== undefined ? sizes[sz] : 0}
                      onChange={(e) => handleSizeChange(sz, e.target.value)}
                      className="w-full px-1.5 py-1 text-center font-mono font-bold text-xs bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                Stock Mínimo Alerta (Global)
              </label>
              <input
                type="number"
                required
                min="1"
                value={form.minStock}
                onChange={(e) => setForm((prev) => ({ ...prev, minStock: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <div className="flex items-center justify-between pr-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                  Imagen del Producto
                </label>
                <label className="text-[9px] font-black text-blue-600 hover:underline uppercase tracking-wider font-mono cursor-pointer flex items-center gap-1">
                  <Upload className="w-3 h-3" /> ELEGIR DESDE GALERÍA
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
              <input
                type="url"
                required
                placeholder="Pegar URL de la imagen o elige de tu archivo..."
                value={form.image}
                onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <div className="flex items-center gap-3 mt-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                <div className="w-10 h-12 bg-white rounded border border-slate-200 overflow-hidden flex-shrink-0">
                  <img
                    src={
                      form.image ||
                      "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=800"
                    }
                    alt="preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=800";
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  Vista previa de imagen.
                </p>
              </div>
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                Descripción del Catálogo
              </label>
              <textarea
                placeholder="Describe los acabados, tipo de tela, densidad y recomendaciones de lavado..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-blue-500/10 font-mono"
            >
              Crear y Sincronizar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all font-mono"
            >
              Cerrar
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

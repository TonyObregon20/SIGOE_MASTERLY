import AdminDialog from "@/components/admin/AdminDialog";
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
    <AdminDialog label="Agregar producto" onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-shop-ink/60 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-[2px] border border-shop-line w-full max-w-lg overflow-y-auto max-h-[92vh] flex flex-col max-h-[90dvh]"
      >
        <div className="flex items-center justify-between p-5 border-b border-shop-line bg-shop-light flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-shop-blue" />
            <h3 className="font-semibold text-sm text-shop-ink">
              Nuevo Producto / Prenda con Tallas
            </h3>
          </div>
          <button aria-label="Cerrar ventana"
            type="button"
            onClick={onClose}
            className="p-1.5 text-shop-muted hover:text-shop-muted hover:bg-shop-light rounded-[2px] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <label className="text-[11px] font-semibold text-shop-muted pl-1">
                Nombre de la Prenda
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Camisa Slim Fit Algodón"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-shop-light border border-shop-line rounded-[2px] font-semibold focus:outline-none focus:ring-2 focus:ring-shop-blue/20 focus:border-shop-line transition-all min-h-10 min-w-0 text-base sm:text-[13px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-shop-muted pl-1">
                Categoría
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-shop-light border border-shop-line rounded-[2px] font-semibold focus:outline-none focus:ring-2 focus:ring-shop-blue/20 focus:border-shop-line transition-all min-h-10 min-w-0 text-base sm:text-[13px]"
              >
                <option value="Formal">Formal</option>
                <option value="Casual">Casual</option>
                <option value="Exterior">Exterior</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-shop-muted pl-1">
                Precio Web (S/)
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-shop-light border border-shop-line rounded-[2px] font-semibold focus:outline-none focus:ring-2 focus:ring-shop-blue/20 focus:border-shop-line transition-all tabular-nums min-h-10 min-w-0 text-base sm:text-[13px]"
              />
            </div>

            {/* Sizes Stock Grid */}
            <div className="col-span-2 bg-shop-light/50 p-3.5 rounded-[2px] border border-blue-150 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-blue-900 flex items-center gap-1.5 tabular-nums">
                  <Layers className="w-3.5 h-3.5 text-shop-blue" /> Cantidades Iniciales por Talla:
                </label>
                <span className="text-[11px] font-semibold tabular-nums bg-shop-ink text-white px-2 py-0.5 rounded-[2px]">
                  Total: {totalPhysical} prendas
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1">
                {["S", "M", "L", "XL"].map((sz) => (
                  <div key={sz} className="bg-white p-2 rounded-[2px] border border-shop-line text-center">
                    <span className="text-[11px] font-semibold tabular-nums text-shop-muted block mb-1">
                      Talla {sz}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={sizes[sz] !== undefined ? sizes[sz] : 0}
                      onChange={(e) => handleSizeChange(sz, e.target.value)}
                      className="w-full px-1.5 py-1 text-center tabular-nums font-medium bg-shop-light border border-shop-line rounded-[2px] focus:ring-2 focus:ring-shop-blue/20 outline-none min-h-10 min-w-0 text-base sm:text-[13px]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-[11px] font-semibold text-shop-muted pl-1">
                Stock Mínimo Alerta (Global)
              </label>
              <input
                type="number"
                required
                min="1"
                value={form.minStock}
                onChange={(e) => setForm((prev) => ({ ...prev, minStock: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-shop-light border border-shop-line rounded-[2px] font-semibold focus:outline-none focus:ring-2 focus:ring-shop-blue/20 focus:border-shop-line transition-all tabular-nums min-h-10 min-w-0 text-base sm:text-[13px]"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <div className="flex items-center justify-between pr-1">
                <label className="text-[11px] font-semibold text-shop-muted pl-1">
                  Imagen del Producto
                </label>
                <label className="text-[11px] font-semibold text-shop-blue hover:underline tabular-nums cursor-pointer flex items-center gap-1">
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
                className="w-full px-3 py-2 bg-shop-light border border-shop-line rounded-[2px] font-semibold focus:outline-none focus:ring-2 focus:ring-shop-blue/20 focus:border-shop-line transition-all min-h-10 min-w-0 text-base sm:text-[13px]"
              />
              <div className="flex items-center gap-3 mt-1.5 bg-shop-light p-2 rounded-[2px] border border-shop-line/60">
                <div className="w-10 h-12 bg-white rounded-[2px] border border-shop-line overflow-hidden flex-shrink-0">
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
                <p className="text-[11px] text-shop-muted">
                  Vista previa de imagen.
                </p>
              </div>
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-[11px] font-semibold text-shop-muted pl-1">
                Descripción del Catálogo
              </label>
              <textarea
                placeholder="Describe los acabados, tipo de tela, densidad y recomendaciones de lavado..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-shop-light border border-shop-line rounded-[2px] font-semibold focus:outline-none focus:ring-2 focus:ring-shop-blue/20 focus:border-shop-line transition-all min-h-10 min-w-0 text-base sm:text-[13px]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-shop-line">
            <button
              type="submit"
              className="flex-1 py-3 bg-shop-ink hover:bg-shop-ink text-white rounded-[2px] text-xs font-semibold transition-all tabular-nums"
            >
              Crear y Sincronizar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 bg-shop-light hover:bg-slate-200 text-shop-muted rounded-[2px] text-xs font-semibold transition-all tabular-nums min-h-9"
            >
              Cerrar
            </button>
          </div>
        </form>
      </motion.div>
    </AdminDialog>
  );
}

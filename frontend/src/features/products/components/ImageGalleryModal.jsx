import AdminDialog from "@/components/admin/AdminDialog";
import React from "react";
import { ShoppingBag, Upload, X } from "lucide-react";
import { motion } from "motion/react";
import { APPAREL_PRESETS } from "../productsUtils";


/**
 * Image Picker modal supporting local device upload (via FileReader) and catalog preset selections
 */
export default function ImageGalleryModal({ isOpen, onClose, onSelectImage }) {
  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP, etc.)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        onSelectImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <AdminDialog label="Seleccionar imagen" onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-shop-ink/60 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-[2px] border border-shop-line w-full max-w-2xl overflow-y-auto max-h-[90dvh]"
      >
        <div className="flex items-center justify-between p-5 border-b border-shop-line bg-shop-light">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-shop-blue" />
            <h3 className="font-semibold text-sm text-shop-ink">
              Galería y Carga de Imágenes
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

        <div className="p-6 space-y-5">
          {/* Option 1: Upload from local files */}
          <div className="bg-shop-light border-2 border-dashed border-blue-300 hover:border-shop-line rounded-[2px] p-5 transition-all text-center group cursor-pointer">
            <input
              type="file"
              accept="image/*"
              id="gallery-file-input"
              className="hidden"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="gallery-file-input"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <div className="w-12 h-12 rounded-[2px] bg-shop-ink group-hover:bg-shop-ink text-white flex items-center justify-center transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-shop-ink group-hover:text-shop-blue transition-colors">
                  Subir foto desde mis archivos (PC / Celular)
                </p>
                <p className="text-[11px] text-shop-muted font-medium mt-0.5">
                  Haz clic aquí para examinar y elegir cualquier imagen de tu dispositivo (JPG, PNG, WebP)
                </p>
              </div>
            </label>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-shop-line" />
            <span className="flex-shrink mx-3 text-[11px] font-semibold text-shop-muted tabular-nums">
              O elige una de nuestras imágenes catálogo
            </span>
            <div className="flex-grow border-t border-shop-line" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-[280px] overflow-y-auto p-1">
            {APPAREL_PRESETS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectImage(item.url)}
                className="group border border-shop-line hover:border-shop-line rounded-[2px] overflow-hidden text-left bg-shop-light hover:bg-white transition-all p-1 flex flex-col h-full"
              >
                <div className="w-full h-28 bg-white rounded-[2px] overflow-hidden border border-shop-line relative">
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-1 right-1 bg-shop-ink/80 text-white text-[11px] tabular-nums px-1.5 py-0.5 rounded-[2px] font-semibold">
                    {item.category}
                  </span>
                </div>
                <div className="p-2 flex-1 flex flex-col justify-between">
                  <h5 className="font-semibold text-[11px] text-shop-ink tracking-tight line-clamp-2 leading-tight">
                    {item.name}
                  </h5>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-shop-line">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-shop-light hover:bg-slate-200 text-shop-muted rounded-[2px] text-xs font-semibold transition-all tabular-nums min-h-9"
            >
              Regresar
            </button>
          </div>
        </div>
      </motion.div>
    </AdminDialog>
  );
}

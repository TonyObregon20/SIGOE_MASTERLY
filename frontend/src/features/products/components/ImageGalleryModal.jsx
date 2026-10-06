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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">
              Galería y Carga de Imágenes
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

        <div className="p-6 space-y-5">
          {/* Option 1: Upload from local files */}
          <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-2xl p-5 transition-all text-center group cursor-pointer shadow-xs hover:shadow-md">
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
              <div className="w-12 h-12 rounded-2xl bg-blue-600 group-hover:bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-110">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-900 group-hover:text-blue-600 transition-colors">
                  Subir foto desde mis archivos (PC / Celular)
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Haz clic aquí para examinar y elegir cualquier imagen de tu dispositivo (JPG, PNG, WebP)
                </p>
              </div>
            </label>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-3 text-[10px] font-black uppercase text-slate-400 tracking-widest font-mono">
              O elige una de nuestras imágenes catálogo
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-[280px] overflow-y-auto p-1">
            {APPAREL_PRESETS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectImage(item.url)}
                className="group border border-slate-200 hover:border-blue-500 rounded-xl overflow-hidden text-left bg-slate-50 hover:bg-white transition-all p-1 hover:shadow-md flex flex-col h-full"
              >
                <div className="w-full h-28 bg-white rounded-lg overflow-hidden border border-slate-100 relative">
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-black">
                    {item.category}
                  </span>
                </div>
                <div className="p-2 flex-1 flex flex-col justify-between">
                  <h5 className="font-black text-[10px] text-slate-800 uppercase tracking-tight line-clamp-2 leading-tight">
                    {item.name}
                  </h5>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all font-mono"
            >
              Regresar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

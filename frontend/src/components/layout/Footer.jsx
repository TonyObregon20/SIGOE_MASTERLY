import React from "react";
import { Mail, MapPin, Phone, ShieldCheck, Sparkles, ArrowUpRight } from "lucide-react";
import logoImg from "@/assets/images/logoMasterly.png";

function Footer({ setView }) {
  const handleNav = (targetView) => {
    if (typeof setView === "function") {
      setView(targetView);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="w-full bg-white border-t border-slate-200 mt-20 pt-16 pb-12 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-12 pb-12 border-b border-slate-100">
          
          {/* Column 1: Brand & Craftsmanship */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm overflow-hidden">
                <img
                  src={logoImg}
                  alt="Masterly"
                  className="w-full h-full object-contain scale-[1.35]"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = "https://ui-avatars.com/api/?name=M&background=0f172a&color=fff";
                  }}
                />
              </div>
              <span className="font-serif italic font-black text-xl tracking-tight text-slate-950">
                MASTERLY
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Sastrería y confección de alta costura con los más altos estándares textiles y producción bajo demanda a nivel nacional.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-md font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Garantía y Calidad Certificada
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 font-mono">
              Navegación
            </h4>
            <ul className="space-y-2.5 text-xs font-medium text-slate-500">
              <li>
                <button
                  type="button"
                  onClick={() => handleNav("store")}
                  className="hover:text-blue-600 transition-colors flex items-center gap-1 group"
                >
                  Inicio
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav("products")}
                  className="hover:text-blue-600 transition-colors flex items-center gap-1 group"
                >
                  Catálogo en Stock
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav("pedido")}
                  className="hover:text-blue-600 transition-colors flex items-center gap-1 group"
                >
                  Confección a Pedido
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav("collections")}
                  className="hover:text-blue-600 transition-colors flex items-center gap-1 group"
                >
                  Colecciones Exclusivas
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav("about")}
                  className="hover:text-blue-600 transition-colors flex items-center gap-1 group"
                >
                  Sobre Nosotros
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care & Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 font-mono">
              Atención al Cliente
            </h4>
            <ul className="space-y-2.5 text-xs font-medium text-slate-500">
              <li className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer transition-colors">
                <Sparkles className="w-3 h-3 text-amber-500" /> Asesoría de Tallas y Ajuste
              </li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors">
                Políticas de Envío y Devolución
              </li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors">
                Facturación Electrónica SUNAT
              </li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors">
                Preguntas Frecuentes (FAQ)
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Locations */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 font-mono">
              Contacto y Canales
            </h4>
            <div className="space-y-2.5 text-xs text-slate-500">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <span>Calle Las Camelias 480, San Isidro, Lima, Perú</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="font-mono font-medium text-slate-800">ventas@masterly.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="font-mono text-slate-600">+51 (01) 421-8900</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright notice */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 font-mono">
          <div>
            © {new Date().getFullYear()} MASTERLY S.A.C. Todos los derechos reservados.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-700 cursor-pointer transition-colors">Términos del Servicio</span>
            <span className="hover:text-slate-700 cursor-pointer transition-colors">Privacidad</span>
            <span className="hover:text-slate-700 cursor-pointer transition-colors">Libro de Reclamaciones</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

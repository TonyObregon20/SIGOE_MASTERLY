import React from "react";
import { motion } from "motion/react";

function AboutUsPage() {
  return (
    <div className="space-y-32 pb-32">
      {/* Hero Section */}
      <section className="relative h-[80vh] -mx-4 -mt-8 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1558002038-1055907df8b7?auto=format&fit=crop&q=80&w=1920"
          alt="Artisan Crafting"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl px-4 space-y-6"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400">Desde 1994</span>
            <h1 className="text-7xl font-serif italic font-black text-white leading-tight underline decoration-blue-500/50 decoration-4 font-serif">Nuestra Herencia.</h1>
            <p className="text-xl text-slate-300 italic font-medium leading-relaxed">
              En MASTERLY, no solo creamos ropa; esculpimos piezas de identidad. Cada costura es un testimonio de nuestra dedicación a la excelencia artesanal.
            </p>
          </motion.div>
        </div>
      </section>

      {/* The Story Sections */}
      <div className="max-w-5xl mx-auto space-y-40">
        {/* Heritage */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl font-serif italic font-black text-slate-900 border-b-4 border-blue-500 inline-block pb-2 font-serif">El Arte de la Camisa.</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed font-medium">
              <p>Nuestra historia comienza en un pequeño taller familiar, donde la obsesión por el corte perfecto superaba cualquier otra prioridad. Creíamos, y seguimos creyendo, que una camisa es el cimiento de la confianza.</p>
              <p>Utilizamos exclusivamente algodones seleccionados de los mejores molinos del mundo, procesados con técnicas que respetan la fibra y aseguran una durabilidad que trasciende las modas efímeras.</p>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl skew-y-3">
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1000"
                alt="Finest Textiles"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-blue-600/10 rounded-2xl -z-10 skew-y-3 border border-blue-200" />
          </div>
        </section>

        {/* Philosophy - Centered Text */}
        <section className="text-center max-w-3xl mx-auto space-y-12">
          <div className="w-16 h-px bg-slate-300 mx-auto" />
          <h2 className="text-5xl font-serif italic font-black text-slate-900 font-serif">"La elegancia es la única belleza que nunca se desvanece."</h2>
          <div className="grid grid-cols-3 gap-8 text-left">
            <div className="space-y-2">
              <span className="text-3xl font-black text-blue-600 font-serif">01.</span>
              <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-900">Calidad</h4>
              <p className="text-[10px] text-slate-500 font-bold leading-tight">Control riguroso en cada uno de nuestros 12 procesos de inspección.</p>
            </div>
            <div className="space-y-2">
              <span className="text-3xl font-black text-indigo-600 font-serif">02.</span>
              <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-900">Diseño</h4>
              <p className="text-[10px] text-slate-500 font-bold leading-tight">Proporciones áureas aplicadas al patronaje moderno.</p>
            </div>
            <div className="space-y-2">
              <span className="text-3xl font-black text-emerald-600 font-serif">03.</span>
              <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-900">Ética</h4>
              <p className="text-[10px] text-slate-500 font-bold leading-tight">Producción responsable con trato justo a nuestros maestros costureros.</p>
            </div>
          </div>
        </section>

        {/* The Workshop */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div className="order-2 md:order-1 relative">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl -skew-y-3">
              <img
                src="https://images.unsplash.com/photo-1599723091942-0b70d4734685?auto=format&fit=crop&q=80&w=1000"
                className="w-full h-full object-cover"
                alt="The Workshop"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-indigo-600/10 rounded-2xl -z-10 -skew-y-3 border border-indigo-200" />
          </div>
          <div className="order-1 md:order-2 space-y-6">
            <h2 className="text-4xl font-serif italic font-black text-slate-900 border-b-4 border-indigo-500 inline-block pb-2 font-serif">El Taller de Maestros.</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed font-medium">
              <p>Ubicado en el corazón de nuestra ciudad, nuestro taller es un santuario de la precisión. Aquí, la tecnología de punta convive con técnicas de sastrería tradicional.</p>
              <p>Cada operario en MASTERLY cuenta con más de una década de experiencia, asegurando que cada ojal, cada solapa y cada dobladillo sea una obra de arte por derecho propio.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Final CTA */}
      <section className="bg-slate-900 rounded-[3rem] p-20 text-center space-y-8 relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <h2 className="text-5xl font-serif italic font-black text-white font-serif">Únete a la Tradición.</h2>
          <p className="text-slate-400 max-w-xl mx-auto italic font-medium">Suscríbete para recibir noticias exclusivas sobre lanzamientos de edición limitada y eventos privados.</p>
          <div className="flex max-w-md mx-auto pt-6">
            <input type="email" placeholder="email@masterly.com" className="flex-1 bg-white/10 border-none rounded-l-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            <button className="px-10 bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] rounded-r-2xl hover:bg-blue-500 transition-all font-mono">Suscribirse</button>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent opacity-50" />
      </section>
    </div>
  );
}

export default AboutUsPage;

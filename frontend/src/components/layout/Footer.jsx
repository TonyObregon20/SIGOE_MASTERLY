import { ShopContainer } from '@/components/shop/ShopUI';

export default function Footer({ setView }) {
  return (
    <footer className="bg-shop-dark pt-10 font-shop text-white md:pt-14">
      <ShopContainer>
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 pb-10 lg:grid-cols-[1.4fr_.8fr_1fr_1fr] lg:gap-11 lg:pb-13">
          <div className="col-span-2 lg:col-span-1"><div className="text-[27px] font-medium tracking-[.12em]">MASTERLY</div><p className="mt-4 max-w-[290px] text-xs leading-7 text-slate-300">Camisería con atención en el tejido, el corte y cada detalle. Prendas para llevar a tu manera.</p></div>
          {[
            ['La colección', [['products', 'Comprar camisas'], ['collections', 'Colecciones'], ['about', 'Nuestro oficio']]],
            ['Tu compra', [['products', 'Explorar modelos'], ['store', 'Volver al inicio']]],
          ].map(([title, links]) => <div key={title}><h2 className="mb-5 text-xs font-medium tracking-wider uppercase">{title}</h2>{links.map(([target, label]) => <button key={label} type="button" onClick={() => setView(target)} className="mb-3 block text-left text-xs text-slate-300 hover:text-white hover:underline hover:underline-offset-4">{label}</button>)}</div>)}
          <div><h2 className="mb-5 text-xs font-medium tracking-wider uppercase">A tu medida</h2><p className="text-xs leading-7 text-slate-300">Venta directa y confección a pedido. Consulta las tallas y disponibilidad en cada modelo.</p></div>
        </div>
        <div className="flex flex-col justify-between gap-2 border-t border-white/15 py-5 text-[11px] text-slate-400 sm:flex-row"><span>© {new Date().getFullYear()} Masterly. Todos los derechos reservados.</span><span>Hecho para vestir a tu manera.</span></div>
      </ShopContainer>
    </footer>
  );
}

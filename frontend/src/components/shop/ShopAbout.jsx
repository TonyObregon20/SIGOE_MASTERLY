import { ArrowUpRight } from 'lucide-react';
import { shopImages, ShopButton, ShopContainer, ShopEyebrow, ShopLink, ShopPageTitle } from './ShopUI';

export default function ShopAbout({ onBrowse }) {
  return (
    <>
      <ShopPageTitle eyebrow="Nuestro oficio" title="Una manera propia de hacer camisas.">Masterly nace de una idea sencilla: vestir bien empieza por prestar atención.</ShopPageTitle>
      <ShopContainer className="pb-12 md:pb-[76px]">
        <section className="grid items-center gap-8 sm:grid-cols-2 lg:gap-20">
          <img src={shopImages.workshop} alt="El oficio de confeccionar una camisa" loading="lazy" className="h-[320px] w-full object-cover md:h-[480px]" />
          <div><ShopEyebrow>Masterly</ShopEyebrow><h2 className="max-w-lg text-[clamp(31px,3.4vw,44px)] leading-tight font-medium tracking-tight">La diferencia está en lo que eliges cuidar.</h2><p className="mt-5 text-sm leading-8 text-shop-muted">El tejido que tocas. El corte que te acompaña. El acabado que notas cuando te abotonas una camisa.</p><p className="mt-4 text-sm leading-8 text-shop-muted">Nuestra propuesta reúne esas decisiones para crear prendas que puedas llevar a tu manera, del trabajo a tus encuentros de cada día.</p><ShopLink className="mt-6" onClick={() => onBrowse()}>Descubre la colección <ArrowUpRight size={16} /></ShopLink></div>
        </section>
        <section className="my-12 grid gap-8 border-y border-shop-line py-10 md:my-[76px] md:grid-cols-3 md:gap-14">
          {[
            ['01', 'El tejido', 'El punto de partida de cada camisa. Texturas y acabados que definen cómo se ve y cómo se siente.'],
            ['02', 'El corte', 'Las proporciones importan. Una silueta que te permita vestir con naturalidad.'],
            ['03', 'Los detalles', 'Cuello, puños y costuras. Las pequeñas decisiones que completan una prenda.'],
          ].map(([number, title, description]) => <article key={number}><span className="text-xs text-shop-blue">{number}</span><h3 className="mt-3 text-2xl font-medium tracking-tight">{title}</h3><p className="mt-3 text-sm leading-7 text-shop-muted">{description}</p></article>)}
        </section>
        <section className="grid items-center gap-8 sm:grid-cols-2 lg:gap-20">
          <div><ShopEyebrow>De tu primera camisa a tu favorita</ShopEyebrow><h2 className="text-[clamp(31px,3.4vw,44px)] leading-tight font-medium tracking-tight">Hechas para acompañarte.</h2><p className="mt-5 mb-6 text-sm leading-8 text-shop-muted">Una ocasión formal, un día de trabajo o un encuentro sin planes. Explora nuestras colecciones y encuentra las prendas que quieras volver a usar.</p><ShopButton variant="outline" onClick={() => onBrowse()}>Encontrar mi camisa <ArrowUpRight size={16} /></ShopButton></div>
          <img src={shopImages.shirts} alt="Selección de camisas Masterly" loading="lazy" className="h-[320px] w-full object-cover md:h-[480px]" />
        </section>
      </ShopContainer>
    </>
  );
}

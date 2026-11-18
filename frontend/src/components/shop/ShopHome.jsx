import { useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, Scissors, PackageCheck, Ruler } from 'lucide-react';
import StoreProductCard from '@/features/products/components/StoreProductCard';
import { shopImages, ShopButton, ShopContainer, ShopEyebrow, ShopEmpty, ShopHeading, ShopLink, ShopProductGrid, ShopProductSkeleton } from './ShopUI';
import { ShopCollectionTile, ShopFeature } from './ShopEditorial';

const occasions = [
  { category: 'Formal', title: 'El arte de vestir bien.', label: 'La línea formal', image: shopImages.white },
  { category: 'Casual', title: 'Tu día, a tu manera.', label: 'Casual y Oxford', image: shopImages.oxford },
  { category: 'Exterior', title: 'Completa tu estilo.', label: 'La selección exterior', image: shopImages.navy },
];

export default function ShopHome({ products, addToCart, isLoggedIn, currentUser, setView, onBrowse, loading }) {
  const [filter, setFilter] = useState('Todos');
  const publicProducts = useMemo(() => products.filter(product => product.isPublic !== false), [products]);
  const filtered = publicProducts.filter(product => filter === 'Todos' || product.category === filter);
  const categories = ['Todos', ...new Set(publicProducts.map(product => product.category).filter(Boolean))];
  return (
    <>
      <section aria-labelledby="home-title" className="relative isolate flex min-h-[550px] items-end bg-shop-dark text-white md:min-h-[620px] 2xl:min-h-[700px]">
        <img src={shopImages.campaign} alt="Camisería Masterly: estilo formal en azul marino" fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover object-[64%_center] md:object-[center_32%]" />
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-shop-dark/85 to-transparent md:bg-linear-to-r md:from-shop-dark/80 md:via-shop-dark/15" />
        <ShopContainer className="py-10 md:py-[76px]">
          <ShopEyebrow className="text-shop-sky">Masterly · La colección</ShopEyebrow>
          <h1 id="home-title" className="mb-5 max-w-[740px] text-[clamp(47px,5.8vw,78px)] leading-[1.04] font-medium tracking-[-.055em]">Tu estilo.<br />En cada detalle.</h1>
          <p className="max-w-[380px] text-sm leading-8 text-slate-100">Una buena camisa cambia la forma de empezar el día. Encuentra la tuya.</p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <ShopButton variant="white" onClick={() => onBrowse()}>Comprar camisas <ArrowRight size={16} /></ShopButton>
            <ShopLink className="text-white" onClick={() => setView('collections')}>Ver colecciones <ArrowUpRight size={15} /></ShopLink>
          </div>
        </ShopContainer>
      </section>
      <ShopContainer className="py-11 md:py-[76px]">
        <ShopHeading title="De lunes a donde quieras." label="Encuentra tu ocasión">Camisas que te acompañan del trabajo a los encuentros de cada día.</ShopHeading>
        <div className="grid gap-7 sm:grid-cols-3 sm:gap-5">{occasions.map(collection => <ShopCollectionTile key={collection.category} {...collection} onBrowse={onBrowse} />)}</div>
      </ShopContainer>
      <ShopContainer className="border-t border-shop-line py-11 md:py-[76px]">
        <ShopHeading title="Tus próximas favoritas." action={<ShopLink onClick={() => onBrowse()}>Ver todo <ArrowUpRight size={15} /></ShopLink>} />
        <div className="mb-7 flex flex-wrap gap-x-6 gap-y-2" role="group" aria-label="Colecciones de productos">
          {categories.map(category => <button type="button" key={category} aria-pressed={filter === category} onClick={() => setFilter(category)} className="border-b border-transparent py-2 text-[13px] text-shop-muted aria-pressed:border-shop-ink aria-pressed:text-shop-ink">{category === 'Todos' ? 'La selección' : category}</button>)}
        </div>
        {loading && !products.length ? <ShopProductSkeleton /> : filtered.length ? (
          <ShopProductGrid>{filtered.slice(0, 8).map((product, index) => <StoreProductCard key={product.id || product._id || index} product={product} addToCart={addToCart} isLoggedIn={isLoggedIn} currentUser={currentUser} />)}</ShopProductGrid>
        ) : <ShopEmpty title="No hay modelos en esta selección." action={<ShopLink onClick={() => setFilter('Todos')}>Ver la selección completa</ShopLink>}>Explora las demás colecciones para encontrar tu próxima camisa.</ShopEmpty>}
      </ShopContainer>
      <ShopFeature image={shopImages.atelier} alt="El trabajo detrás de cada camisa" label="Nuestro oficio" title={<>Lo que se ve.<br />Y lo que se siente.</>} action="Conoce Masterly" onBrowse={() => setView('about')}>El tejido, el corte y los acabados. Nos interesan esas pequeñas decisiones que hacen que una camisa se convierta en tu favorita.</ShopFeature>
      <ShopContainer className="flex flex-col justify-between gap-7 border-b border-shop-line py-8 sm:flex-row">
        {[[Ruler, 'Elige tu ajuste', 'Tallas y disponibilidad en cada modelo.'], [Scissors, 'Confección a pedido', 'Lotes con distribución de tallas personalizada.'], [PackageCheck, 'Tu compra, a mano', 'Pedidos y comprobantes desde tu cuenta.']].map(([Icon, title, description]) => <div key={title} className="flex flex-1 items-start gap-3"><Icon size={23} strokeWidth={1.3} className="shrink-0" /><div><strong className="block text-[13px] font-medium">{title}</strong><p className="mt-1 text-xs leading-6 text-shop-muted">{description}</p></div></div>)}
      </ShopContainer>
    </>
  );
}

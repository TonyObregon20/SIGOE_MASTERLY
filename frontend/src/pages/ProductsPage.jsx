import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import StoreProductCard from '@/features/products/components/StoreProductCard';
import { ShopContainer, ShopEmpty, ShopLink, ShopPageTitle, ShopProductGrid, ShopProductSkeleton } from '@/components/shop/ShopUI';

export default function ProductsPage({ products, addToCart, isLoggedIn, currentUser, initialQuery = '', initialCategory = 'Todos', loading }) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [priceRange, setPriceRange] = useState([0, 300]);
  const [sortBy, setSortBy] = useState('featured');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const categories = ['Todos', ...new Set(products.filter(p => p.isPublic !== false).map(p => p.category).filter(Boolean))];
  const filteredProducts = useMemo(() => products
    .filter(p => p.isPublic !== false)
    .filter(p => {
      const matchesSearch = `${p.name || ''} ${p.category || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'Todos' || p.category === categoryFilter;
      const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      return matchesSearch && matchesCategory && matchesPrice;
    })
    .sort((a, b) => sortBy === 'price-asc' ? a.price - b.price : sortBy === 'price-desc' ? b.price - a.price : 0), [products, searchQuery, categoryFilter, priceRange, sortBy]);
  const reset = () => { setSearchQuery(''); setCategoryFilter('Todos'); setPriceRange([0, 300]); };
  return (
    <>
      <ShopPageTitle eyebrow="La colección" title="Encuentra tu próxima camisa.">Texturas, cortes y detalles para vestir cada día a tu manera.</ShopPageTitle>
      <ShopContainer className="pb-12 md:pb-20">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-y border-shop-line py-5">
          <label className="flex w-full items-center gap-3 sm:w-auto"><Search size={18} aria-hidden="true" /><input type="search" aria-label="Buscar camisas" placeholder="Buscar camisas, texturas…" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} className="min-w-0 flex-1 bg-white py-2 text-base sm:w-60 sm:text-sm" /></label>
          <button type="button" aria-expanded={filtersOpen} aria-controls="catalog-filters" onClick={() => setFiltersOpen(!filtersOpen)} className="inline-flex items-center gap-2 text-xs lg:hidden"><SlidersHorizontal size={15} />Filtros</button>
          <div className="ml-auto flex items-center gap-5 text-xs"><span className="hidden text-shop-muted sm:block">{filteredProducts.length} modelos</span><select aria-label="Ordenar productos" value={sortBy} onChange={event => setSortBy(event.target.value)} className="max-w-full bg-white py-2"><option value="featured">Destacados</option><option value="price-asc">Precio: menor a mayor</option><option value="price-desc">Precio: mayor a menor</option></select></div>
        </div>
        <div className="grid gap-7 lg:grid-cols-[175px_minmax(0,1fr)] lg:gap-11">
          <aside id="catalog-filters" aria-label="Filtros del catálogo" className={`${filtersOpen ? 'block' : 'hidden'} space-y-6 bg-shop-light p-5 lg:block lg:bg-transparent lg:p-0`}>
            <fieldset className="border-b border-shop-line pb-6"><legend className="mb-4 text-[13px] font-medium">Colección</legend><div className="space-y-3">{categories.map(category => <label key={category} className="flex items-center gap-3 text-xs"><input type="radio" name="category" checked={categoryFilter === category} onChange={() => setCategoryFilter(category)} className="size-4 accent-shop-ink" />{category}</label>)}</div></fieldset>
            <fieldset className="border-b border-shop-line pb-6"><legend className="mb-4 text-[13px] font-medium">Precio máximo</legend><input type="range" aria-label="Precio máximo en soles" min="0" max="300" step="10" value={priceRange[1]} onChange={event => setPriceRange([0, Number(event.target.value)])} className="w-full accent-shop-ink" /><p className="mt-3 text-xs text-shop-muted">Hasta S/ {priceRange[1]}</p></fieldset>
            <ShopLink onClick={reset}>Limpiar filtros</ShopLink>
          </aside>
          <div className="min-w-0">
            {loading && !products.length ? <ShopProductSkeleton count={6} /> : filteredProducts.length ? <ShopProductGrid catalog>{filteredProducts.map((product, index) => <StoreProductCard key={product.id || product._id || index} product={product} addToCart={addToCart} isLoggedIn={isLoggedIn} currentUser={currentUser} />)}</ShopProductGrid> : <ShopEmpty title="No encontramos resultados." action={<ShopLink onClick={reset}>Ver todos los modelos</ShopLink>}>Prueba otra búsqueda o ajusta los filtros.</ShopEmpty>}
          </div>
        </div>
      </ShopContainer>
    </>
  );
}

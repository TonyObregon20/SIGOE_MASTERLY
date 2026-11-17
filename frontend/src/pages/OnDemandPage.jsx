import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import OnDemandProductCard from '@/features/products/components/OnDemandProductCard';
import { ShopContainer, ShopEmpty, ShopPageTitle, ShopProductGrid, money } from '@/components/shop/ShopUI';

export default function OnDemandPage({ products, addToCart, isLoggedIn, currentUser }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const filteredProducts = useMemo(() => products.filter(p => p.isPublic !== false).filter(p => `${p.name || ''} ${p.category || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) && (categoryFilter === 'Todos' || p.category === categoryFilter)), [products, searchQuery, categoryFilter]);
  const categories = ['Todos', ...new Set(products.filter(p => p.isPublic !== false).map(p => p.category).filter(Boolean))];
  return (
    <>
      <ShopPageTitle eyebrow="Confección a pedido" title="Tu selección. En la cantidad que necesitas.">Elige los modelos y personaliza la distribución de tallas de cada lote. Adelanto del 50% y seguimiento desde tu cuenta.</ShopPageTitle>
      <ShopContainer className="pb-14 md:pb-20">
        {isLoggedIn && currentUser?.creditEnabled && <div className="mb-8 flex flex-wrap justify-between gap-3 bg-shop-light px-6 py-5 text-sm"><span>Línea de crédito disponible: <strong className="font-medium">{money(Math.max(0, (currentUser.creditLimit || 0) - (currentUser.creditUsed || 0)))}</strong></span><span className="text-xs text-shop-muted">Límite: {money(currentUser.creditLimit)}</span></div>}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-5 border-y border-shop-line py-5"><label className="flex items-center gap-3"><Search size={18} /><input type="search" aria-label="Buscar modelos a pedido" placeholder="Buscar un modelo…" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} className="min-w-0 bg-white py-2 text-base sm:text-sm" /></label><select aria-label="Colección a pedido" value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} className="bg-white py-2 text-sm">{categories.map(category => <option key={category}>{category}</option>)}</select></div>
        {filteredProducts.length ? <ShopProductGrid>{filteredProducts.map((product, index) => <OnDemandProductCard key={product.id || product._id || index} product={product} addToCart={addToCart} />)}</ShopProductGrid> : <ShopEmpty title="No hay modelos en esta selección.">Prueba otra búsqueda o cambia de colección.</ShopEmpty>}
      </ShopContainer>
    </>
  );
}

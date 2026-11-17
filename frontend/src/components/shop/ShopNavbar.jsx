import { useEffect, useRef, useState } from 'react';
import { Menu, X, Search, ShoppingBag, UserRound, LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCart } from '@/features/cart/hooks/useCart';
import { shopImages, ShopButton, ShopContainer, ShopIconButton } from './ShopUI';

export default function ShopNavbar({ view, setView, setIsLoginOpen, onOpenCustomerDrawer, onSearch }) {
  const { isLoggedIn, currentUser, logout } = useAuth();
  const { cart, openCart } = useCart();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);
  const links = [['products', 'Comprar'], ['collections', 'Colecciones'], ['about', 'Nosotros']];
  if (isLoggedIn && currentUser?.creditEnabled) links.push(['pedido', 'A pedido']);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const navigate = target => {
    if (target === 'products') onSearch(''); else setView(target);
    setMenu(false); setSearch(false);
  };
  useEffect(() => {
    const close = event => { if (event.key === 'Escape') { setMenu(false); setSearch(false); } };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, []);
  useEffect(() => { if (search) searchRef.current?.focus(); }, [search]);
  return (
    <>
      <a href="#main-content" className="sr-only z-[200] bg-white p-4 focus:not-sr-only focus:fixed focus:top-0">Ir al contenido</a>
      {view !== 'admin' && <div className="bg-shop-ink px-5 py-2 text-center text-[11px] tracking-wide text-white">MASTERLY · Camisería masculina · Venta directa y a pedido</div>}
      <header className="sticky top-0 z-50 border-b border-shop-line bg-white font-shop text-shop-ink">
        <ShopContainer className="grid h-[74px] grid-cols-[36px_minmax(0,1fr)_104px] items-center gap-0 sm:grid-cols-[1fr_auto_1fr] lg:h-[88px] lg:gap-6">
          <div>
            <ShopIconButton className="w-9 lg:hidden" aria-label={menu ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menu} aria-controls="masterly-mobile-nav" onClick={() => { setMenu(!menu); setSearch(false); }}>{menu ? <X size={21} /> : <Menu size={21} />}</ShopIconButton>
            <nav aria-label="Navegación principal" className="hidden items-center gap-6 whitespace-nowrap lg:flex">
              {links.map(([target, label]) => <button type="button" key={target} onClick={() => navigate(target)} aria-current={view === target ? 'page' : undefined} className="border-b border-transparent py-3 text-xs aria-[current=page]:border-shop-ink">{label}</button>)}
            </nav>
          </div>
          <button type="button" className="mx-auto w-[130px] max-w-full sm:w-[155px] xl:w-[185px]" onClick={() => navigate('store')} aria-label="Masterly, ir al inicio"><img src={shopImages.brand} alt="Masterly" className="h-14 w-full object-contain lg:h-[65px]" /></button>
          <div className="flex items-center justify-end">
            {currentUser?.role === 'admin' && <button type="button" className="mr-2 hidden text-[11px] lg:block" onClick={() => navigate(view === 'admin' ? 'store' : 'admin')}>{view === 'admin' ? 'Tienda' : 'Admin'}</button>}
            <ShopIconButton className="w-8 sm:w-10" aria-label="Buscar productos" aria-expanded={search} aria-controls="masterly-search" onClick={() => { setSearch(!search); setMenu(false); }}><Search size={19} strokeWidth={1.5} /></ShopIconButton>
            <ShopIconButton className="w-8 sm:w-10" aria-label={isLoggedIn ? 'Abrir mi cuenta' : 'Iniciar sesión'} onClick={isLoggedIn ? onOpenCustomerDrawer : () => setIsLoginOpen(true)}><UserRound size={19} strokeWidth={1.5} /></ShopIconButton>
            <ShopIconButton className="relative w-8 sm:w-10" aria-label={`Abrir bolsa, ${count} prendas`} onClick={openCart}><ShoppingBag size={19} strokeWidth={1.5} />{count > 0 && <span className="absolute top-0 right-0 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-shop-ink px-1 text-[9px] text-white">{count}</span>}</ShopIconButton>
            {isLoggedIn && <ShopIconButton className="hidden sm:inline-flex" aria-label="Cerrar sesión" onClick={() => { logout(); navigate('store'); }}><LogOut size={18} strokeWidth={1.5} /></ShopIconButton>}
          </div>
        </ShopContainer>
        {search && <div id="masterly-search" className="border-t border-shop-line py-5"><ShopContainer><form role="search" className="mx-auto flex max-w-[800px] flex-wrap items-center gap-3" onSubmit={event => { event.preventDefault(); onSearch(query.trim()); setSearch(false); }}><Search size={20} aria-hidden="true" /><input ref={searchRef} type="search" aria-label="Buscar en el catálogo" placeholder="¿Qué camisa estás buscando?" value={query} onChange={event => setQuery(event.target.value)} className="min-w-0 flex-1 border-b border-shop-ink bg-white py-3 text-base sm:text-sm" /><ShopButton type="submit">Buscar</ShopButton><ShopIconButton aria-label="Cerrar buscador" onClick={() => setSearch(false)}><X size={19} /></ShopIconButton></form></ShopContainer></div>}
        {menu && <nav id="masterly-mobile-nav" aria-label="Navegación móvil" className="border-t border-shop-line px-6 pt-3 pb-6 lg:hidden">
          {[['store', 'Inicio'], ...links, ...(currentUser?.role === 'admin' ? [['admin', 'Administración']] : [])].map(([target, label]) => <button type="button" key={target} onClick={() => navigate(target)} aria-current={view === target ? 'page' : undefined} className="block w-full border-b border-shop-line py-3 text-left text-sm aria-[current=page]:font-semibold">{label}</button>)}
          {isLoggedIn && <button type="button" className="mt-5 text-sm" onClick={() => { logout(); navigate('store'); }}>Cerrar sesión</button>}
        </nav>}
      </header>
    </>
  );
}

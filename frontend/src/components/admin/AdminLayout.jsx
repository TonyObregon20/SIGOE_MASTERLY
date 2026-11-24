import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight, Banknote, ClipboardList, LayoutDashboard, LogOut,
  Menu, Package, RefreshCw, Scissors, ShoppingBag, Truck, Users, X, Clock, UserCog
} from 'lucide-react';
import SidebarItem from '@/components/layout/SidebarItem';
import { shopImages } from '@/components/shop/ShopUI';

const adminNavigation = [
  { label: 'General', items: [{ id: 'dashboard', label: 'Resumen', icon: LayoutDashboard }] },
  { label: 'Comercio', items: [
    { id: 'sales', label: 'Ventas', icon: Banknote },
    { id: 'ecommerce', label: 'Productos', icon: ShoppingBag },
    { id: 'invoices', label: 'Comprobantes', icon: ClipboardList },
  ] },
  { label: 'Operaciones', items: [
    { id: 'inventory', label: 'Almacén y Kardex', icon: Package },
    { id: 'production', label: 'Producción', icon: Scissors },
    { id: 'suppliers', label: 'Proveedores', icon: Truck },
  ] },
  { label: 'Administración', items: [
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'workers', label: 'Trabajadores', icon: UserCog },
    { id: 'attendance', label: 'Asistencia', icon: Clock },
  ] },
];

const workerNavigation = [
  { label: 'General', items: [
    { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
    { id: 'attendance', label: 'Mi asistencia', icon: Clock },
  ] },
  { label: 'Operaciones', items: [
    { id: 'inventory', label: 'Almacén y Kardex', icon: Package },
    { id: 'production', label: 'Producción', icon: Scissors },
  ] },
  { label: 'Comercio', items: [
    { id: 'sales', label: 'Ventas', icon: Banknote },
    { id: 'invoices', label: 'Comprobantes', icon: ClipboardList },
  ] },
];

export default function AdminLayout({ currentUser, activeTab, onNavigate, onRefresh, onLogout, onStore, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);
  const navigationPanel = useRef(null);
  const navigation = currentUser?.role === "worker" ? workerNavigation : adminNavigation;
  const activeItem = navigation.flatMap(group => group.items).find(item => item.id === activeTab);
  const initials = (currentUser?.name || 'Administrador').split(/\s+/).slice(0, 2).map(part => part[0]).join('');

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    navigationPanel.current?.querySelector('button')?.focus();
    const onKeyDown = event => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = event => {
      if (event.matches) setMenuOpen(false);
    };
    desktop.addEventListener('change', closeOnDesktop);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      desktop.removeEventListener('change', closeOnDesktop);
      menuButton.current?.focus();
    };
  }, [menuOpen]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  const navigate = tab => {
    onNavigate(tab);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-dvh bg-[#f6f8fb] font-shop text-sm leading-relaxed text-shop-ink lg:grid lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[232px_minmax(0,1fr)]">
      <a href="#admin-content" className="sr-only z-[100] bg-white p-4 focus:not-sr-only focus:fixed focus:top-0">Ir al contenido del administrador</a>
      {menuOpen && <button type="button" aria-label="Cerrar navegación" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-[70] bg-shop-dark/50 lg:hidden" />}
      <aside ref={navigationPanel} id="admin-navigation" aria-label="Módulos de administración" className={`${menuOpen ? 'fixed inset-y-0 left-0 z-[80] flex w-[252px]' : 'hidden w-[220px]'} flex-col bg-shop-dark text-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:h-dvh lg:w-[220px] xl:w-[232px]`}>
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-6">
          <button type="button" onClick={onStore} aria-label="Masterly, ir a la tienda"><img src={shopImages.brand} alt="Masterly" className="h-12 w-[154px] object-contain brightness-0 invert" /></button>
          <button type="button" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} className="p-2 lg:hidden"><X size={18} /></button>
        </div>
        <nav aria-label="Navegación del administrador" className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-5 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
          {navigation.map(group => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-medium tracking-[.12em] text-slate-400 uppercase">{group.label}</p>
              <div className="space-y-1">{group.items.map(item => <SidebarItem key={item.id} active={activeTab === item.id} onClick={() => navigate(item.id)} icon={item.icon} label={item.label} />)}</div>
            </div>
          ))}
        </nav>
        <div className="shrink-0 border-t border-white/10 p-5">
          <div className="mb-4 flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center border border-white/20 text-xs font-medium text-shop-sky" aria-hidden="true">{initials}</span><div className="min-w-0"><p className="truncate text-xs font-medium">{currentUser?.name}</p><p className="text-[11px] text-slate-400">{currentUser?.role === "worker" ? "Trabajador" : "Administrador"}</p></div></div>
          <button type="button" onClick={onLogout} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white"><LogOut size={14} />Cerrar sesión</button>
        </div>
      </aside>
      <div className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-30 flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-shop-line bg-white px-4 py-4 sm:px-7 xl:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <button ref={menuButton} type="button" onClick={() => setMenuOpen(true)} aria-label="Abrir menú de administración" aria-expanded={menuOpen} aria-controls="admin-navigation" className="p-2 lg:hidden"><Menu size={20} /></button>
            <p className="flex flex-wrap items-center gap-2 text-xs"><span className="hidden text-shop-muted sm:inline">Administración</span><span className="hidden text-slate-300 sm:inline" aria-hidden="true">/</span><span className="font-medium">{activeItem?.label}</span></p>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-5">
            <button type="button" onClick={onRefresh} aria-label="Sincronizar datos" className="inline-flex min-h-9 items-center gap-2 px-2 text-xs text-shop-muted hover:text-shop-ink"><RefreshCw size={14} /><span className="hidden sm:inline">Sincronizar</span></button>
            <button type="button" onClick={onStore} className="inline-flex min-h-9 items-center gap-2 border border-shop-line px-3 text-xs font-medium hover:bg-shop-light">Ver tienda<ArrowUpRight size={14} /></button>
          </div>
        </header>
        <div id="admin-content" tabIndex={-1} className="mx-auto w-full max-w-[1680px] p-4 outline-none sm:p-7 xl:p-10">{children}</div>
      </div>
    </div>
  );
}

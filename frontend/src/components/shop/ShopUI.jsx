import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import campaign from '@/assets/shop/campaign.jpg';
import oxford from '@/assets/shop/oxford.jpg';
import atelier from '@/assets/shop/atelier.jpg';
import white from '@/assets/shop/white.jpg';
import navy from '@/assets/shop/navy.jpg';
import shirts from '@/assets/shop/shirts.jpg';
import workshop from '@/assets/shop/workshop.jpg';
import brand from '@/assets/shop/brand.png';

export const shopImages = { campaign, oxford, atelier, white, navy, shirts, workshop, brand };
export const money = value => `S/ ${Number(value || 0).toFixed(2)}`;

export function ShopContainer({ children, className = '', ...props }) {
  return <div className={`mx-auto w-[calc(100%-32px)] max-w-[1400px] md:w-[calc(100%-48px)] xl:w-[calc(100%-80px)] ${className}`} {...props}>{children}</div>;
}

export function ShopEyebrow({ children, className = '' }) {
  return <p className={`mb-3 text-[11px] font-semibold uppercase tracking-[.12em] text-shop-blue ${className}`}>{children}</p>;
}

export function ShopButton({ children, variant = 'solid', className = '', ...props }) {
  const variants = {
    solid: 'border-shop-ink bg-shop-ink text-white hover:border-[#0a2472] hover:bg-[#0a2472]',
    outline: 'border-shop-ink bg-transparent text-shop-ink hover:bg-shop-light',
    white: 'border-white bg-white text-shop-ink hover:border-shop-light hover:bg-shop-light',
  };
  return <button type="button" className={`inline-flex min-h-11 items-center justify-center gap-3 border px-5 py-3 text-[13px] font-medium transition-colors motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`} {...props}>{children}</button>;
}

export function ShopLink({ children, className = '', ...props }) {
  return <button type="button" className={`inline-flex items-center gap-2 bg-transparent p-0 text-[13px] font-medium underline underline-offset-[5px] ${className}`} {...props}>{children}</button>;
}

export function ShopIconButton({ children, className = '', ...props }) {
  return <button type="button" className={`flex size-10 shrink-0 items-center justify-center bg-transparent ${className}`} {...props}>{children}</button>;
}

export function ShopHeading({ label, title, children, action }) {
  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        {label && <ShopEyebrow>{label}</ShopEyebrow>}
        <h2 className="text-[clamp(26px,3vw,38px)] leading-tight font-medium tracking-[-.04em]">{title}</h2>
        {children && <p className="mt-3 max-w-xl text-sm leading-8 text-shop-muted">{children}</p>}
      </div>
      {action}
    </div>
  );
}

export function ShopPageTitle({ eyebrow, title, children }) {
  return (
    <ShopContainer className="pt-9 pb-8 md:pt-13 md:pb-9">
      {eyebrow && <ShopEyebrow>{eyebrow}</ShopEyebrow>}
      <h1 className="max-w-5xl text-[clamp(34px,4vw,52px)] leading-[1.1] font-medium tracking-[-.04em]">{title}</h1>
      {children && <p className="mt-4 max-w-[610px] text-sm leading-8 text-shop-muted">{children}</p>}
    </ShopContainer>
  );
}

export function ShopField({ label, children, className = '' }) {
  const id = useId();
  return <div className={`space-y-2 ${className}`}><label htmlFor={id} className="block text-xs text-shop-muted">{label}</label>{children(id)}</div>;
}

export const shopInput = 'min-h-11 w-full border border-shop-line bg-white px-3 py-3 text-base text-shop-ink sm:text-sm';

export function ShopEmpty({ title, children, action }) {
  return <div className="py-20 text-center"><h2 className="text-2xl font-medium tracking-tight">{title}</h2>{children && <p className="mt-3 mb-6 text-sm leading-7 text-shop-muted">{children}</p>}{action}</div>;
}

export function ShopProductGrid({ children, catalog = false }) {
  return <div className={`grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 ${catalog ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} xl:gap-x-6`}>{children}</div>;
}

export function ShopModal({ title, eyebrow, onClose, children, wide = false, drawer = false }) {
  const panel = useRef(null);
  const close = useRef(onClose);
  const titleId = useId();
  close.current = onClose;
  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    const keydown = event => {
      if (event.key === 'Escape') close.current();
      if (event.key !== 'Tab') return;
      const controls = [...panel.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], textarea:not(:disabled)')].filter(element => element.offsetParent !== null);
      if (!controls.length) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === controls[0] || document.activeElement === panel.current)) {
        event.preventDefault(); controls.at(-1).focus();
      } else if (!event.shiftKey && document.activeElement === controls.at(-1)) {
        event.preventDefault(); controls[0].focus();
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', keydown);
      if (previousFocus?.isConnected) previousFocus.focus?.();
    };
  }, []);
  return (
    <div className={`fixed inset-0 z-[120] flex font-shop text-[15px] leading-relaxed text-shop-ink ${drawer ? 'justify-end' : 'items-center justify-center p-4'}`}>
      <div className="absolute inset-0 bg-shop-dark/50" onClick={onClose} aria-hidden="true" />
      <section ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`relative flex w-full flex-col bg-white outline-none ${drawer ? 'h-full max-w-[460px]' : `max-h-[92dvh] overflow-y-auto ${wide ? 'max-w-[960px]' : 'max-w-[470px]'}`}`}>
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-shop-line p-6 sm:p-7">
          <div>{eyebrow && <ShopEyebrow>{eyebrow}</ShopEyebrow>}<h2 id={titleId} className="text-[28px] leading-tight font-medium tracking-tight">{title}</h2></div>
          <ShopIconButton aria-label="Cerrar ventana" onClick={onClose}><X size={21} /></ShopIconButton>
        </header>
        {children}
      </section>
    </div>
  );
}

export function ShopProductSkeleton({ count = 4 }) {
  return <div role="status" aria-label="Cargando colección"><ShopProductGrid>{Array.from({ length: count }, (_, index) => <div key={index} aria-hidden="true"><div className="aspect-[3/4] bg-slate-100" /><div className="mt-4 h-3 w-4/5 bg-slate-100" /><div className="mt-4 h-3 w-2/5 bg-slate-100" /></div>)}</ShopProductGrid></div>;
}

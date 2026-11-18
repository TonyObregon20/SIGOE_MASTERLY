import { ArrowUpRight } from 'lucide-react';
import { ShopEyebrow, ShopLink } from './ShopUI';

export function ShopCollectionTile({ category, title, label, image, description, onBrowse }) {
  return (
    <button type="button" onClick={() => onBrowse(category)} className="group flex min-w-0 flex-col items-start text-left">
      <div className="aspect-[1.18] w-full overflow-hidden bg-slate-100 sm:aspect-[4/5]">
        <img src={image} alt={label} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025] motion-reduce:transition-none" />
      </div>
      <div className="flex w-full items-center justify-between gap-4 pt-4">
        <div><h3 className="text-xl leading-snug font-medium tracking-tight">{title}</h3><p className="mt-1 text-xs text-shop-muted">{label}</p></div>
        <ArrowUpRight size={20} strokeWidth={1.4} className="shrink-0" />
      </div>
      {description && <p className="mt-3 max-w-xl text-sm leading-7 text-shop-muted">{description}</p>}
    </button>
  );
}

export function ShopFeature({ image, alt, label, title, children, action, onBrowse }) {
  return (
    <section className="grid bg-shop-light sm:grid-cols-2">
      <img src={image} alt={alt} loading="lazy" className="h-[310px] w-full object-cover sm:h-full sm:min-h-[420px]" />
      <div className="flex flex-col items-start justify-center px-6 py-10 md:p-11 xl:p-[70px]">
        <ShopEyebrow>{label}</ShopEyebrow>
        <h2 className="max-w-[440px] text-[clamp(32px,3.6vw,49px)] leading-[1.12] font-medium tracking-[-.045em]">{title}</h2>
        <p className="mt-5 max-w-[430px] text-sm leading-8 text-shop-muted">{children}</p>
        <ShopLink className="mt-6" onClick={onBrowse}>{action} <ArrowUpRight size={16} /></ShopLink>
      </div>
    </section>
  );
}

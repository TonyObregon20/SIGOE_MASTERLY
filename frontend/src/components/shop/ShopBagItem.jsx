import { Minus, Plus, X } from 'lucide-react';
import { money, ShopIconButton } from './ShopUI';

export default function ShopBagItem({ item, onRemove, onQuantity }) {
  return (
    <article className="flex gap-4 border-b border-shop-line py-5">
      <img src={item.product.image} alt={item.product.name} className="h-[103px] w-[76px] shrink-0 object-cover sm:h-[120px] sm:w-[88px]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3"><h3 className="text-[13px] leading-6 font-medium">{item.product.name}</h3>{onRemove && <ShopIconButton className="-mt-2 -mr-2 size-8" aria-label={`Quitar ${item.product.name}`} onClick={onRemove}><X size={15} /></ShopIconButton>}</div>
        <p className="mt-1 text-[11px] text-shop-muted">{item.product.category}{item.selectedSize && ` · Talla ${item.selectedSize}`}</p>
        {item.sizeDistribution && <p className="mt-1 text-[11px] text-shop-muted">{Object.entries(item.sizeDistribution).filter(([, quantity]) => quantity > 0).map(([size, quantity]) => `${size}: ${quantity}`).join(' · ')}</p>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {onQuantity ? <div className="flex items-center border border-shop-line"><ShopIconButton className="size-8" aria-label={`Reducir cantidad de ${item.product.name}`} onClick={() => onQuantity(-1)}><Minus size={12} /></ShopIconButton><span className="min-w-6 text-center text-xs" aria-live="polite">{item.quantity}</span><ShopIconButton className="size-8" aria-label={`Aumentar cantidad de ${item.product.name}`} onClick={() => onQuantity(1)}><Plus size={12} /></ShopIconButton></div> : <span className="text-xs text-shop-muted">{item.quantity} unidades</span>}
          <strong className="text-[13px] font-medium">{money(item.product.price * item.quantity)}</strong>
        </div>
      </div>
    </article>
  );
}

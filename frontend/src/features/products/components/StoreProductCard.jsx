import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { getAvailableStock, getSizeStockBreakdown } from '../productsUtils';
import { ShopButton, money } from '@/components/shop/ShopUI';

export default function StoreProductCard({ product, addToCart, isLoggedIn, currentUser }) {
  const [selectedSize, setSelectedSize] = useState('M');
  const sizeBreakdown = getSizeStockBreakdown(product);
  const currentSizeStock = sizeBreakdown[selectedSize] ?? 0;
  const totalStockAvailable = getAvailableStock(product);
  const isCreditUser = isLoggedIn && currentUser?.creditEnabled;
  const isOutOfStockInSize = !isCreditUser && currentSizeStock <= 0;
  return (
    <article className="group flex h-full min-w-0 flex-col">
      <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
        <img src={product.image} alt={product.name} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none" />
        {(isCreditUser || currentSizeStock <= 3) && <span className="absolute top-2 left-2 bg-white px-2 py-1 text-[11px] text-shop-ink sm:top-3 sm:left-3">{isCreditUser ? 'A pedido' : currentSizeStock <= 0 ? `Agotado en ${selectedSize}` : `Últimas ${currentSizeStock} en ${selectedSize}`}</span>}
      </div>
      <div className="flex flex-1 flex-col pt-4">
        <p className="mb-1 text-[11px] text-shop-muted">{product.category}</p>
        <h3 className="text-xs leading-6 font-medium sm:text-sm">{product.name}</h3>
        <p className="mt-1 text-sm font-medium">{money(product.price)}</p>
        <div className="mt-4 flex gap-1 sm:gap-2" role="group" aria-label={`Talla de ${product.name}`}>
          {['S', 'M', 'L', 'XL'].map(size => <button type="button" key={size} aria-pressed={selectedSize === size} aria-label={`${size}, ${isCreditUser ? 'a pedido' : `${sizeBreakdown[size] || 0} disponibles`}`} data-unavailable={!isCreditUser && (sizeBreakdown[size] || 0) <= 0} onClick={() => setSelectedSize(size)} className="h-9 min-w-7 border border-shop-line px-1 text-[11px] data-[unavailable=true]:text-slate-400 data-[unavailable=true]:line-through aria-pressed:border-shop-ink aria-pressed:bg-shop-ink aria-pressed:text-white aria-pressed:no-underline sm:min-w-9">{size}</button>)}
        </div>
        <p className="my-3 min-h-8 text-[11px] leading-5 text-shop-muted">{isCreditUser ? 'Confección a pedido disponible.' : `${currentSizeStock} disponibles en ${selectedSize} · ${totalStockAvailable} en total`}</p>
        <ShopButton className="mt-auto w-full gap-2 px-2 text-[11px] sm:text-xs" disabled={isOutOfStockInSize} onClick={() => addToCart(product, 1, selectedSize)}><ShoppingBag size={14} className="hidden sm:block" />{isOutOfStockInSize ? 'Talla agotada' : `Agregar talla ${selectedSize}`}</ShopButton>
      </div>
    </article>
  );
}

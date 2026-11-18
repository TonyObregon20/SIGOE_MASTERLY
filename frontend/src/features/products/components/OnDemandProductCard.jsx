import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ShopButton, money } from '@/components/shop/ShopUI';

export default function OnDemandProductCard({ product, addToCart }) {
  const [qty, setQty] = useState(10);
  const [sizes, setSizes] = useState({ S: 2, M: 3, L: 3, XL: 2 });
  const syncSizesWithTotal = total => {
    const S = Math.round(total * .2);
    const M = Math.round(total * .3);
    const L = Math.round(total * .3);
    const XL = total - S - M - L;
    setSizes({ S, M, L, XL: Math.max(0, XL) });
  };
  const handleTotalQtyChange = newTotal => {
    const finalTotal = Math.max(1, newTotal);
    setQty(finalTotal); syncSizesWithTotal(finalTotal);
  };
  const changeSize = (size, value) => {
    const parsed = parseInt(value);
    const updatedSizes = { ...sizes, [size]: Number.isNaN(parsed) ? 0 : Math.max(0, parsed) };
    setSizes(updatedSizes);
    setQty(Object.values(updatedSizes).reduce((sum, quantity) => sum + quantity, 0));
  };
  return (
    <article className="flex h-full min-w-0 flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100"><img src={product.image} alt={product.name} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" /><span className="absolute top-3 left-3 bg-white px-2 py-1 text-[11px]">Confección a pedido</span></div>
      <p className="mt-4 text-[11px] text-shop-muted">{product.category}</p><h3 className="mt-1 text-sm font-medium">{product.name}</h3><p className="mt-1 text-sm">{money(product.price)} <span className="text-xs text-shop-muted">/ unidad</span></p>
      <div className="my-4 bg-shop-light p-3 sm:p-4">
        <label className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">Unidades del lote<input type="number" min="1" aria-label={`Unidades del lote de ${product.name}`} value={qty} onChange={event => handleTotalQtyChange(parseInt(event.target.value) || 1)} className="w-16 border border-shop-line bg-white px-2 py-2 text-base sm:text-sm" /></label>
        <div className="grid grid-cols-4 gap-1 sm:gap-2">
          {['S', 'M', 'L', 'XL'].map(size => (
            <label key={size} className="flex min-w-0 flex-col items-center gap-1 text-center text-[11px] text-shop-muted">
              <span className="font-medium">{size}</span>
              <input
                type="number"
                min="0"
                aria-label={`Cantidad talla ${size} de ${product.name}`}
                value={sizes[size] || 0}
                onChange={event => changeSize(size, event.target.value)}
                className="h-9 w-full min-w-0 appearance-none border border-shop-line bg-white p-0 text-center text-base tabular-nums text-shop-ink sm:text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </label>
          ))}
        </div>
      </div>
      <div className="mb-4 flex flex-wrap justify-between gap-2 text-xs text-shop-muted"><span>Total del lote</span><strong className="font-medium text-shop-ink">{money(product.price * qty)}</strong></div>
      <ShopButton className="mt-auto w-full px-2 text-xs" disabled={qty <= 0} onClick={() => addToCart(product, qty, null, sizes)}><Plus size={15} />Agregar lote</ShopButton>
      <p className="mt-3 text-[11px] text-shop-muted">Adelanto del 50% · Distribución personalizada</p>
    </article>
  );
}

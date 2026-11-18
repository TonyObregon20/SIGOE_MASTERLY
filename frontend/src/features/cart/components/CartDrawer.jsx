import React from "react";
import { ChevronRight } from 'lucide-react';
import { ShopButton, ShopEmpty, ShopLink, ShopModal, money } from '@/components/shop/ShopUI';
import ShopBagItem from '@/components/shop/ShopBagItem';
import { useCart } from "@/features/cart/hooks/useCart";
import { useAuth } from "@/features/auth/hooks/useAuth";

function CartDrawer({
  isOpen: propIsOpen,
  onClose: propOnClose,
  cart: propCart,
  removeFromCart: propRemoveFromCart,
  updateCartQuantity: propUpdateCartQuantity,
  cartTotal: propCartTotal,
  isLoggedIn: propIsLoggedIn,
  setIsLoginOpen,
  setIsPaymentModalOpen
}) {
  const {
    isCartOpen: contextIsOpen,
    closeCart: contextCloseCart,
    cart: contextCart,
    removeFromCart: contextRemoveFromCart,
    updateCartQuantity: contextUpdateCartQuantity,
    cartTotal: contextCartTotal
  } = useCart();
  const { isLoggedIn: contextIsLoggedIn } = useAuth();

  const isOpen = propIsOpen !== undefined ? propIsOpen : contextIsOpen;
  const onClose = propOnClose || contextCloseCart;
  const cart = propCart || contextCart || [];
  const removeFromCart = propRemoveFromCart || contextRemoveFromCart;
  const updateCartQuantity = propUpdateCartQuantity || contextUpdateCartQuantity;
  const cartTotal = propCartTotal !== undefined ? propCartTotal : contextCartTotal;
  const isLoggedIn = propIsLoggedIn !== undefined ? propIsLoggedIn : contextIsLoggedIn;

  if (!isOpen) return null;

  return (
    <ShopModal drawer title="Tu bolsa" eyebrow={cart.reduce((sum, item) => sum + item.quantity, 0) + ' prendas seleccionadas'} onClose={onClose}>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 sm:px-7">
        {cart.length ? cart.map((item, index) => <ShopBagItem key={index} item={item} onRemove={() => removeFromCart(item.product.id, item.selectedSize, item.sizeDistribution)} onQuantity={delta => updateCartQuantity(item.product.id, delta, item.selectedSize, item.sizeDistribution)} />) : <ShopEmpty title="Tu bolsa está vacía." action={<ShopLink onClick={onClose}>Explorar la colección</ShopLink>}>Encuentra esa camisa que quieras volver a usar.</ShopEmpty>}
      </div>
      <div className="shrink-0 border-t border-shop-line bg-shop-light p-6 sm:p-7">
        <div className="mb-3 flex justify-between text-xs text-shop-muted"><span>Subtotal</span><span>{money(cartTotal)}</span></div>
        <div className="mb-5 flex justify-between border-t border-shop-line pt-4"><span className="text-base">Total</span><strong className="text-xl font-medium">{money(cartTotal)}</strong></div>
        <ShopButton className="w-full" disabled={!cart.length} onClick={() => { onClose(); if (!isLoggedIn) setIsLoginOpen(true); else setIsPaymentModalOpen(true); }}>Continuar con mi compra <ChevronRight size={16} /></ShopButton>
        <div className="mt-4 text-center"><ShopLink onClick={onClose}>Seguir comprando</ShopLink></div>
      </div>
    </ShopModal>
  );
}

export default CartDrawer;

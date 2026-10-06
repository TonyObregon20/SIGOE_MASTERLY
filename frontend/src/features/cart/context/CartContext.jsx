import React, { createContext, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { isSameCartItem, calculateCartTotal, calculateCartCount } from "../cartUtils";

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { isLoggedIn, currentUser } = useAuth();

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const clearCart = useCallback(() => {
    setCart([]);
    setIsCartOpen(false);
  }, []);

  const addToCart = useCallback((product, qty = 1, selectedSize = "M", sizeDistribution) => {
    setCart((prev) => {
      const existing = prev.find((item) =>
        isSameCartItem(item, product.id, selectedSize, sizeDistribution)
      );

      // Calcular stock disponible para la talla seleccionada
      let stockAvailable = 0;
      if (product.sizes && product.sizes[selectedSize]) {
        const sz = product.sizes[selectedSize];
        const phys = typeof sz === "number" ? sz : (Number(sz.stockPhysical) || 0);
        const comm = typeof sz === "object" ? (Number(sz.stockCommitted) || 0) : 0;
        stockAvailable = Math.max(0, phys - comm);
      } else {
        const phys = Number(product.stockPhysical) || 0;
        const comm = Number(product.stockCommitted) || 0;
        stockAvailable = Math.max(0, phys - comm);
      }

      const isCreditUser = isLoggedIn && currentUser?.creditEnabled;

      if (existing) {
        if (!isCreditUser && !sizeDistribution && existing.quantity + qty > stockAvailable) {
          alert(`Stock insuficiente en talla ${selectedSize}. Solo quedan ${stockAvailable} unidades disponibles para venta directa.`);
          return prev;
        }
        return prev.map((item) =>
          isSameCartItem(item, product.id, selectedSize, sizeDistribution)
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      if (!isCreditUser && !sizeDistribution && qty > stockAvailable) {
        alert(`No hay stock suficiente en talla ${selectedSize}. Stock disponible: ${stockAvailable} unidades.`);
        return prev;
      }
      return [...prev, { product, quantity: qty, selectedSize, sizeDistribution }];
    });
    setIsCartOpen(true);
  }, [isLoggedIn, currentUser]);

  const removeFromCart = useCallback((productId, selectedSize, sizeDistribution) => {
    setCart((prev) =>
      prev.filter(
        (item) => !isSameCartItem(item, productId, selectedSize, sizeDistribution)
      )
    );
  }, []);

  const updateCartQuantity = useCallback((productId, delta, selectedSize, sizeDistribution) => {
    setCart((prev) =>
      prev.map((item) => {
        if (isSameCartItem(item, productId, selectedSize, sizeDistribution)) {
          const isCreditUser = isLoggedIn && currentUser?.creditEnabled;
          let stockAvailable = Infinity;

          if (!isCreditUser && !sizeDistribution && item.product) {
            const size = selectedSize || item.selectedSize || "M";
            if (item.product.sizes && item.product.sizes[size]) {
              const sz = item.product.sizes[size];
              const phys = typeof sz === "number" ? sz : (Number(sz.stockPhysical) || 0);
              const comm = typeof sz === "object" ? (Number(sz.stockCommitted) || 0) : 0;
              stockAvailable = Math.max(0, phys - comm);
            } else {
              const phys = Number(item.product.stockPhysical) || 0;
              const comm = Number(item.product.stockCommitted) || 0;
              stockAvailable = Math.max(0, phys - comm);
            }
          }

          if (delta > 0 && item.quantity + delta > stockAvailable) {
            alert(`No puedes solicitar más de ${stockAvailable} unidades disponibles en talla ${selectedSize || "M"} para venta directa.`);
            return item;
          }

          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  }, [isLoggedIn, currentUser]);

  const cartTotal = useMemo(() => calculateCartTotal(cart), [cart]);
  const cartCount = useMemo(() => calculateCartCount(cart), [cart]);

  const value = {
    cart,
    setCart,
    cartTotal,
    cartCount,
    isCartOpen,
    openCart,
    closeCart,
    clearCart,
    addToCart,
    removeFromCart,
    updateCartQuantity
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export default CartContext;

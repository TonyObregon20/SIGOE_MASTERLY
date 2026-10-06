import React from "react";
import { ShoppingBag, Plus, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
        />
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-serif italic font-black text-slate-950">Tu Carrito</h2>
              <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
                {cart.reduce((acc, i) => acc + i.quantity, 0)} Items
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5 text-slate-500 rotate-45" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-slate-200" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Tu carrito está vacío</p>
                  <p className="text-xs text-slate-550 font-medium tracking-wide mt-1">Explora nuestra colección y encuentra algo ideal para ti.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex gap-4 group">
                    <div className="w-20 h-24 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight">{item.product.name}</h4>
                          <button
                            onClick={() => removeFromCart(item.product.id, item.selectedSize, item.sizeDistribution)}
                            className="text-slate-350 hover:text-red-500 transition-colors"
                          >
                            <Plus className="w-4 h-4 rotate-45" />
                          </button>
                        </div>
                        
                        <div className="flex flex-col gap-1.5 mt-1">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">{item.product.category}</p>
                          {item.selectedSize && (
                            <span className="inline-block w-fit px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-wider rounded border border-blue-100 font-mono">
                              Talla: {item.selectedSize}
                            </span>
                          )}
                          {item.sizeDistribution && (
                            <div className="flex flex-wrap gap-1 font-mono">
                              {Object.entries(item.sizeDistribution).map(([size, quantity]) => quantity > 0 && (
                                <span key={size} className="px-1.5 py-0.5 bg-slate-50 border border-slate-150 text-slate-600 text-[8px] font-bold rounded">
                                  {size}: {quantity}p
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2 font-mono">
                        <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 border border-slate-100">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, -1, item.selectedSize, item.sizeDistribution)}
                            className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm rounded transition-all"
                          >
                            -
                          </button>
                          <span className="text-[11px] font-black text-slate-950 w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, 1, item.selectedSize, item.sizeDistribution)}
                            className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm rounded transition-all"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm font-black text-slate-900 tracking-tighter">
                          S/ {(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 space-y-4">
            <div className="space-y-4 font-mono">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span>Subtotal</span>
                <span>S/ {cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span>Envío</span>
                <span className="text-blue-600">Gratis</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 font-sans">
                <span className="text-lg font-serif italic font-black text-slate-950">Total</span>
                <span className="text-xl font-black text-slate-950 tracking-tighter font-mono">S/ {cartTotal.toFixed(2)}</span>
              </div>
            </div>
            
            <button
              disabled={cart.length === 0}
              onClick={() => {
                if (!isLoggedIn) {
                  onClose();
                  setIsLoginOpen(true);
                } else {
                  onClose();
                  setIsPaymentModalOpen(true);
                }
              }}
              className={`w-full py-4 text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 font-mono ${
                cart.length > 0 ? "bg-slate-950 shadow-slate-900/20 hover:bg-blue-600" : "bg-slate-300 cursor-not-allowed text-slate-500 shadow-none"
              }`}
            >
              Proceder al Pago <ChevronRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={onClose}
              className="w-full text-center text-[10px] font-black text-slate-450 uppercase tracking-widest hover:text-slate-900 transition-colors font-mono"
            >
              Continuar Comprando
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default CartDrawer;

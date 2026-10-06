import React, { useState } from "react";
import { ShoppingBag, AlertCircle } from "lucide-react";
import { getAvailableStock, getSizeStockBreakdown } from "../productsUtils";

function StoreProductCard({
  product,
  addToCart,
  isLoggedIn,
  currentUser
}) {
  const [selectedSize, setSelectedSize] = useState("M");
  const sizeBreakdown = getSizeStockBreakdown(product);
  const currentSizeStock = getAvailableStock(product, selectedSize);
  const totalStockAvailable = getAvailableStock(product);
  const isCreditUser = isLoggedIn && currentUser?.creditEnabled;
  const isOutOfStockInSize = !isCreditUser && currentSizeStock <= 0;

  return (
    <div className="group relative flex flex-col justify-between h-full bg-white border border-slate-200 hover:border-blue-200 hover:shadow-xl rounded-xl p-3 pb-4 transition-all duration-300">
      <div className="relative aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            disabled={isOutOfStockInSize}
            onClick={() => addToCart(product, 1, selectedSize)}
            className={`w-full py-2.5 text-[10px] font-black uppercase tracking-widest rounded-md flex items-center justify-center gap-1.5 shadow-2xl transition-all ${
              isOutOfStockInSize
                ? "bg-slate-400 text-white cursor-not-allowed"
                : "bg-slate-900 text-white hover:bg-blue-600 active:scale-95"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {isOutOfStockInSize ? "Agotado en Talla" : `Agregar Talla ${selectedSize}`}
          </button>
        </div>

        {/* Stock Badge */}
        {isCreditUser ? (
          <div className="absolute top-3 left-3 px-2 py-0.5 bg-blue-600 text-white text-[7px] font-black uppercase tracking-widest rounded-sm shadow border border-blue-400 font-mono">
            A Pedido
          </div>
        ) : (
          <>
            {currentSizeStock <= 3 && currentSizeStock > 0 && (
              <div className="absolute top-3 left-3 px-2 py-0.5 bg-rose-600 text-white text-[7px] font-black uppercase tracking-widest rounded-sm shadow font-mono">
                ¡Últimas {currentSizeStock} en {selectedSize}!
              </div>
            )}
            {currentSizeStock <= 0 && (
              <div className="absolute top-3 left-3 px-2 py-0.5 bg-slate-700 text-white text-[7px] font-black uppercase tracking-widest rounded-sm shadow font-mono">
                Sin Stock en {selectedSize}
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-3 space-y-2.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-[0.2em]">{product.category}</span>
            <div className="text-sm font-black text-slate-950 font-mono">S/ {Number(product.price || 0).toFixed(2)}</div>
          </div>
          <h3 className="font-bold text-slate-800 text-xs tracking-tight line-clamp-1 mt-0.5">{product.name}</h3>
          
          <div className="mt-1 flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-400">
            {isCreditUser ? (
              <span className="text-blue-500 font-mono">Garantía Producción</span>
            ) : (
              <span className="font-mono text-slate-500">
                Total Prenda: <strong className="text-slate-800">{totalStockAvailable} disp.</strong>
              </span>
            )}
          </div>
        </div>

        {/* Size Selector with Stock indicator per size */}
        <div className="space-y-1.5 bg-slate-50/70 p-2 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">
              Tallas y Stock Disponible:
            </span>
            <span className="text-[8px] font-mono font-bold text-blue-600">
              {currentSizeStock} disp. en {selectedSize}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {["S", "M", "L", "XL"].map((sz) => {
              const szStock = sizeBreakdown[sz] || 0;
              const isSelected = selectedSize === sz;
              const hasNoStock = !isCreditUser && szStock <= 0;

              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  className={`py-1 px-1 flex flex-col items-center justify-center rounded transition-all border ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : hasNoStock
                      ? "bg-slate-100 text-slate-400 border-slate-200 opacity-60"
                      : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <span className="text-[10px] font-black leading-none">{sz}</span>
                  <span
                    className={`text-[7px] font-mono mt-0.5 font-bold leading-none ${
                      isSelected
                        ? "text-blue-100"
                        : hasNoStock
                        ? "text-slate-400"
                        : szStock <= 3
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {isCreditUser ? "Disp" : `${szStock} u.`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          disabled={isOutOfStockInSize}
          onClick={() => addToCart(product, 1, selectedSize)}
          className={`w-full py-2 text-[9px] font-black uppercase tracking-widest rounded transition-all flex items-center justify-center gap-1 font-mono ${
            isOutOfStockInSize
              ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              : "bg-slate-50 text-slate-700 border border-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-100 active:scale-95 shadow-sm"
          }`}
        >
          {isOutOfStockInSize ? (
            <>
              <AlertCircle className="w-3 h-3 text-slate-400" />
              Sin stock en Talla {selectedSize}
            </>
          ) : (
            <>
              <ShoppingBag className="w-3 h-3" />
              Agregar Talla {selectedSize} ({currentSizeStock} disp.)
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default StoreProductCard;

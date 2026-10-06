import React, { useState } from "react";
import { 
  Plus, 
  CreditCard, 
  FileText, 
  ShieldCheck, 
  ShoppingBag, 
  Hammer 
} from "lucide-react";
import { motion } from "motion/react";

function PaymentModal({
  isOpen,
  onClose,
  cart,
  cartTotal,
  currentUser,
  isLoggedIn,
  handleCheckout,
  documentType,
  setDocumentType,
  customerDocument,
  setCustomerDocument
}) {
  const [acquisitionMode, setAcquisitionMode] = useState(
    currentUser?.creditEnabled ? "pedido" : "direct"
  );
  
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [isCvvFocused, setIsCvvFocused] = useState(false);

  if (!isOpen) return null;

  const getCardBrand = () => {
    if (cardNumber.startsWith("4")) return "VISA";
    if (cardNumber.startsWith("5")) return "MASTERCARD";
    if (cardNumber.startsWith("3")) return "AMEX";
    return "UNIVERSAL";
  };

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 2) {
      value = value.slice(0, 2) + "/" + value.slice(2);
    }
    setCardExpiry(value);
  };

  const handleCvvChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    setCardCvv(value);
  };

  const isFormValid = () => {
    const isDocValid = documentType === "Factura" 
      ? customerDocument.length >= 11 
      : customerDocument.length === 0 || customerDocument.length >= 8;
    const isCardValid = cardNumber.replace(/\s/g, "").length === 16 
      && cardExpiry.length === 5 
      && cardCvv.length >= 3 
      && cardName.trim().length > 3;
    return isDocValid && isCardValid;
  };

  const handlePayClick = () => {
    handleCheckout(acquisitionMode, documentType, customerDocument);
    onClose();
  };

  const finalAmount = acquisitionMode === "pedido" ? cartTotal * 0.5 : cartTotal;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-3xl overflow-hidden border border-slate-100 flex flex-col md:flex-row z-10 max-h-[90vh]"
      >
        {/* Left Side: Order & Payment Info */}
        <div className="flex-1 p-8 overflow-y-auto space-y-6 border-b md:border-b-0 md:border-r border-slate-100">
          <div>
            <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.25em]">Caja Masterly</span>
            <h2 className="text-3xl font-serif italic font-black text-slate-950 tracking-tight">Completar Pago</h2>
          </div>

          {/* Modalidad Selector */}
          {isLoggedIn && currentUser?.creditEnabled && (
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Modalidad de Adquisición</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAcquisitionMode("direct")}
                  className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${
                    acquisitionMode === "direct" 
                      ? "border-blue-600 bg-blue-50/20 text-slate-900 shadow-sm" 
                      : "border-slate-200 hover:bg-slate-50 text-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-black uppercase tracking-widest">Venta Directa</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Entrega inmediata de prendas en stock físico. Pago del 100%.</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAcquisitionMode("pedido")}
                  className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${
                    acquisitionMode === "pedido" 
                      ? "border-blue-600 bg-blue-50/20 text-slate-900 shadow-sm" 
                      : "border-slate-200 hover:bg-slate-50 text-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Hammer className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-black uppercase tracking-widest">A Pedido (OP)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium font-sans">
                    Elaboración directa a medida. Inicias producción pagando solo el 50% hoy.
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Comprobante de Pago Block */}
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Documento de Facturación</label>
              <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDocumentType("Boleta")}
                  className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    documentType === "Boleta" ? "bg-white shadow-sm text-slate-900" : "text-slate-400"
                  }`}
                >
                  Boleta de Venta
                </button>
                <button
                  type="button"
                  onClick={() => setDocumentType("Factura")}
                  className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    documentType === "Factura" ? "bg-white shadow-sm text-slate-900" : "text-slate-400"
                  }`}
                >
                  Factura Jurídica
                </button>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                {documentType === "Factura" ? "Consorcio RUC" : "DNI de Identificación (Opcional)"}
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={customerDocument}
                  onChange={(e) => setCustomerDocument(e.target.value.replace(/\D/g, ""))}
                  placeholder={documentType === "Factura" ? "20XXXXXXXXX" : "XXXXXXXX"}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-mono"
                />
              </div>
            </div>
          </div>

          {/* Credit Card Form */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Información de Tarjeta</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Titular de Tarjeta</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="NOMBRE COMPLETO"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none uppercase font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Número de Tarjeta</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="0000 0000 0000 0000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Vencimiento</label>
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={handleExpiryChange}
                  placeholder="MM/AA"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none font-mono text-center"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">CVV / Seguro</label>
                <input
                  type="password"
                  value={cardCvv}
                  onChange={handleCvvChange}
                  onFocus={() => setIsCvvFocused(true)}
                  onBlur={() => setIsCvvFocused(false)}
                  placeholder="•••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none font-mono text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Visual Card Simulator & Summary */}
        <div className="w-full md:w-96 bg-slate-950 p-8 flex flex-col justify-between text-white relative overflow-hidden">
          {/* Glowing background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="space-y-8 relative">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Panel de Pago</h3>
              <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white">
                <span className="text-xs font-black">Esc</span>
              </button>
            </div>

            {/* flip card */}
            <div className="w-full aspect-[1.586/1] rounded-2xl relative shadow-2xl transition-all duration-700 [perspective:1000px] h-48">
              <div className={`relative w-full h-full duration-500 preserve-3d transition-transform ${isCvvFocused ? "rotate-y-180" : ""}`}>
                
                {/* Front Side */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-5 flex flex-col justify-between border border-white/10 backface-hidden shadow-2xl overflow-hidden shadow-black/80">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/5 blur-[30px] rounded-full pointer-events-none" />
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Masterly Luxe Card</span>
                      <div className="w-8 h-6 bg-amber-400/90 rounded-sm flex items-center justify-center p-1 overflow-hidden relative border border-amber-300">
                        <div className="grid grid-cols-3 gap-0.5 w-full h-full opacity-60">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((x) => <div key={x} className="border border-slate-900/40 rounded-[1px]" />)}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-black tracking-widest text-slate-200 text-right">
                      {getCardBrand()}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="text-lg tracking-[0.2em] font-mono text-white/90 drop-shadow-md text-center leading-none">
                      {cardNumber || "•••• •••• •••• ••••"}
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="space-y-0.5 text-left">
                        <span className="text-[7px] text-slate-500 font-bold uppercase tracking-wider block">Titular</span>
                        <div className="text-[10px] uppercase font-mono text-white font-bold tracking-widest truncate max-w-[170px]">
                          {cardName || "TARJETA HABIENTE"}
                        </div>
                      </div>
                      <div className="space-y-0.5 text-right font-mono">
                        <span className="text-[7px] text-slate-500 font-bold uppercase tracking-wider block">Expira</span>
                        <div className="text-[10px] text-white font-bold leading-none">
                          {cardExpiry || "MM/AA"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-950 to-slate-900 rounded-2xl flex flex-col justify-between py-5 border border-white/10 rotate-y-180 backface-hidden shadow-2xl overflow-hidden shadow-black/80">
                  <div className="w-full h-10 bg-black/80 mt-2" />
                  <div className="px-5 space-y-4">
                    <div className="flex items-center justify-end gap-2 bg-white/10 p-1.5 rounded-sm">
                      <span className="text-[8px] italic text-slate-400 uppercase tracking-widest">Firma Autorizada</span>
                      <div className="bg-slate-300 text-slate-950 font-bold font-mono px-3 py-1 rounded-sm text-xs select-none">
                        {cardCvv || "•••"}
                      </div>
                    </div>
                    <p className="text-[7px] text-slate-400/80 leading-tight">
                      Esta tarjeta es intransferible y simula la pasarela de pagos segura e integrada para procesar órdenes VIP de Masterly de forma programada.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Summary */}
            <div className="space-y-3 pt-6 border-t border-white/10 font-sans">
              <div className="flex justify-between text-xs font-medium text-slate-400">
                <span>Total de Carrito:</span>
                <span className="text-white font-mono font-bold">S/ {cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-400">
                <span>Tarifa de Envío:</span>
                <span className="text-blue-400">S/ 0.00 (Gratuito)</span>
              </div>

              {acquisitionMode === "pedido" && (
                <div className="p-3 bg-blue-500/10 border border-blue-400/20 rounded-xl space-y-1 select-none">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-blue-300">
                    <span>Adelanto OP Solicitado</span>
                    <span>50%</span>
                  </div>
                  <p className="text-[8.5px] text-blue-200/70 font-medium leading-normal">
                    Solo abonarás la mitad hoy (S/ {finalAmount.toFixed(2)}) para iniciar la orden en producción. El restante 50% se salda con la validación de despacho.
                  </p>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-2 border-t border-white/10">
                <span className="text-sm font-bold text-slate-300">Monto Neto a Pagar</span>
                <span className="text-2xl font-black text-white tracking-widest font-mono">
                  S/ {finalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="relative pt-6 md:pt-0">
            <button
              type="button"
              disabled={!isFormValid()}
              onClick={handlePayClick}
              className={`w-full py-4 text-xs font-black uppercase tracking-[0.2em] rounded-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
                isFormValid() 
                  ? "bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-50" 
                  : "bg-slate-800 text-slate-500 cursor-not-allowed shadow-none"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              {acquisitionMode === "pedido" ? "Pagar Adelanto e Iniciar OP" : "Pagar Sello y Enviar"}
            </button>
            <div className="text-[8px] text-center text-slate-500 font-bold uppercase tracking-widest italic mt-3 flex items-center justify-center gap-1.5 leading-none">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Transacción encriptada por pasarela segura
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default PaymentModal;

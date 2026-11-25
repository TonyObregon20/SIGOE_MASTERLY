import React, { useState } from "react";
import { ShopButton, ShopField, ShopModal, shopInput, money } from '@/components/shop/ShopUI';
import ShopBagItem from '@/components/shop/ShopBagItem';

function PaymentModal({
  isOpen,
  onClose,
  cart,
  cartTotal,
  currentUser,
  orders = [],
  isLoggedIn,
  handleCheckout,
  documentType,
  setDocumentType,
  customerDocument,
  setCustomerDocument
}) {
  const CREDIT_LIMIT_EXCEEDED_MESSAGE = "Excede su linea de credito";
  const [acquisitionMode, setAcquisitionMode] = useState(
    currentUser?.creditEnabled ? "pedido" : "direct"
  );
  
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [isCvvFocused, setIsCvvFocused] = useState(false);
  const [creditValidationError, setCreditValidationError] = useState("");

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
    if (acquisitionMode === "pedido") {
      const creditLimit = Number(currentUser?.creditLimit || 0);
      const creditUsed = orders
        .filter((order) => (
          order.type === "pedido" &&
          (order.userId === currentUser?.id || order.customerName === currentUser?.name)
        ))
        .reduce((sum, order) => {
          const total = Number(order.total);
          return sum + (Number.isFinite(total) && total > 0 ? total : 0);
        }, 0);
      const availableCredit = Math.max(creditLimit - creditUsed, 0);
      if (
        !currentUser?.creditEnabled ||
        !Number.isFinite(creditLimit) ||
        creditLimit <= 0 ||
        !Number.isFinite(Number(cartTotal)) ||
        Number(cartTotal) <= 0 ||
        Number(cartTotal) > availableCredit
      ) {
        setCreditValidationError(CREDIT_LIMIT_EXCEEDED_MESSAGE);
        return;
      }
    }

    const result = handleCheckout(acquisitionMode, documentType, customerDocument);
    if (result?.then) {
      result.then((checkoutResult) => {
        if (checkoutResult?.success) {
          onClose();
        } else if (checkoutResult?.code === "CREDIT_LIMIT_EXCEEDED") {
          setCreditValidationError(CREDIT_LIMIT_EXCEEDED_MESSAGE);
        } else if (checkoutResult?.message) {
          setCreditValidationError(checkoutResult.message);
        }
      });
    } else {
      onClose();
    }
  };

  const finalAmount = acquisitionMode === "pedido" ? cartTotal * 0.5 : cartTotal;

  return (
    <ShopModal title="Completa tu compra." eyebrow="Tu selección Masterly" onClose={onClose} wide animateOnOpen>
      <div className="grid md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-7 p-6 sm:p-7">
          {isLoggedIn && currentUser?.creditEnabled && <section><h3 className="mb-3 text-sm font-medium">Modalidad de compra</h3><div className="grid grid-cols-2 gap-3">{[['direct', 'Compra directa', 'Pago del 100%'], ['pedido', 'A pedido', 'Adelanto del 50%']].map(([value, label, detail]) => <button type="button" key={value} aria-pressed={acquisitionMode === value} onClick={() => setAcquisitionMode(value)} className="border border-shop-line p-3 text-left text-xs text-shop-muted aria-pressed:border-shop-ink aria-pressed:bg-shop-light aria-pressed:text-shop-ink"><strong className="mb-2 block font-medium">{label}</strong>{detail}</button>)}</div></section>}
          <section className="space-y-4 border-b border-shop-line pb-6">
            <h3 className="text-sm font-medium">Tu comprobante</h3>
            <div className="flex gap-3">{['Boleta', 'Factura'].map(type => <button type="button" key={type} aria-pressed={documentType === type} onClick={() => setDocumentType(type)} className="flex-1 border border-shop-line py-3 text-xs aria-pressed:border-shop-ink aria-pressed:bg-shop-light">{type}</button>)}</div>
            <ShopField label={documentType === 'Factura' ? 'RUC' : 'DNI (opcional)'}>{id => <input id={id} type="text" inputMode="numeric" value={customerDocument} onChange={event => setCustomerDocument(event.target.value.replace(/\D/g, ''))} placeholder={documentType === 'Factura' ? '11 dígitos' : '8 dígitos'} className={shopInput} />}</ShopField>
          </section>
          <section className="space-y-4">
            <div className="flex items-center justify-between"><h3 className="text-sm font-medium">Datos de tarjeta</h3><span className="text-[11px] text-shop-muted">{getCardBrand()}</span></div>
            <ShopField label="Nombre del titular">{id => <input id={id} type="text" autoComplete="cc-name" value={cardName} onChange={event => setCardName(event.target.value)} className={shopInput} />}</ShopField>
            <ShopField label="Número de tarjeta">{id => <input id={id} type="text" inputMode="numeric" autoComplete="cc-number" value={cardNumber} onChange={handleCardNumberChange} placeholder="0000 0000 0000 0000" className={shopInput} />}</ShopField>
            <div className="grid grid-cols-2 gap-4">
              <ShopField label="Vencimiento">{id => <input id={id} type="text" inputMode="numeric" autoComplete="cc-exp" value={cardExpiry} onChange={handleExpiryChange} placeholder="MM/AA" className={shopInput} />}</ShopField>
              <ShopField label="Código de seguridad">{id => <input id={id} type="password" inputMode="numeric" autoComplete="cc-csc" value={cardCvv} onChange={handleCvvChange} onFocus={() => setIsCvvFocused(true)} onBlur={() => setIsCvvFocused(false)} placeholder="CVV" className={shopInput} />}</ShopField>
            </div>
          </section>
          {creditValidationError && <p role="alert" className="border-l-2 border-red-700 pl-3 text-sm text-red-800">{creditValidationError}</p>}
        </div>
        <aside className="border-t border-shop-line bg-shop-light p-6 sm:p-7 md:border-t-0 md:border-l">
          <h3 className="text-xl font-medium tracking-tight">Tu selección</h3>
          {cart.map((item, index) => <ShopBagItem key={index} item={item} />)}
          <div className="mt-5 flex justify-between text-xs text-shop-muted"><span>Total de la bolsa</span><span>{money(cartTotal)}</span></div>
          {acquisitionMode === 'pedido' && <p className="mt-4 text-xs leading-6 text-shop-muted">Abonas el 50% para iniciar la producción. El saldo se paga al validar el despacho.</p>}
          <div className="mt-5 flex items-baseline justify-between border-t border-shop-line pt-5"><span className="text-sm">{acquisitionMode === 'pedido' ? 'Adelanto' : 'Total'}</span><strong className="text-2xl font-medium">{money(finalAmount)}</strong></div>
          <ShopButton className="mt-6 w-full" disabled={!isFormValid()} onClick={handlePayClick}>{acquisitionMode === 'pedido' ? 'Pagar adelanto' : 'Confirmar compra'}</ShopButton>
        </aside>
      </div>
    </ShopModal>
  );
}

export default PaymentModal;

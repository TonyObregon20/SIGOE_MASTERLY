import { useState, useCallback } from "react";

/**
 * Custom hook to encapsulate global application modal overlay states and actions.
 */
export function useAppModals() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginMode, setLoginMode] = useState("login");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isOrderSuccessOpen, setIsOrderSuccessOpen] = useState(false);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [isCustomerDrawerOpen, setIsCustomerDrawerOpen] = useState(false);
  const [documentType, setDocumentType] = useState("Boleta");
  const [customerDocument, setCustomerDocument] = useState("");

  const openLogin = useCallback((mode = "login") => {
    setLoginMode(mode);
    setIsLoginOpen(true);
  }, []);

  const closeLogin = useCallback(() => {
    setIsLoginOpen(false);
  }, []);

  const openPayment = useCallback(() => {
    setIsPaymentModalOpen(true);
  }, []);

  const closePayment = useCallback(() => {
    setIsPaymentModalOpen(false);
  }, []);

  const openOrderSuccess = useCallback(() => {
    setIsOrderSuccessOpen(true);
    setIsPaymentModalOpen(false);
  }, []);

  const closeOrderSuccess = useCallback(() => {
    setIsOrderSuccessOpen(false);
  }, []);

  const openMyOrders = useCallback(() => {
    setIsMyOrdersOpen(true);
  }, []);

  const closeMyOrders = useCallback(() => {
    setIsMyOrdersOpen(false);
  }, []);

  const openCustomerDrawer = useCallback(() => {
    setIsCustomerDrawerOpen(true);
  }, []);

  const closeCustomerDrawer = useCallback(() => {
    setIsCustomerDrawerOpen(false);
  }, []);

  const handleOpenMyOrdersFromSuccess = useCallback(() => {
    setIsOrderSuccessOpen(false);
    setIsCustomerDrawerOpen(true);
  }, []);

  return {
    isLoginOpen,
    setIsLoginOpen,
    loginMode,
    setLoginMode,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isOrderSuccessOpen,
    setIsOrderSuccessOpen,
    isMyOrdersOpen,
    setIsMyOrdersOpen,
    isCustomerDrawerOpen,
    setIsCustomerDrawerOpen,
    documentType,
    setDocumentType,
    customerDocument,
    setCustomerDocument,
    openLogin,
    closeLogin,
    openPayment,
    closePayment,
    openOrderSuccess,
    closeOrderSuccess,
    openMyOrders,
    closeMyOrders,
    openCustomerDrawer,
    closeCustomerDrawer,
    handleOpenMyOrdersFromSuccess
  };
}

export default useAppModals;

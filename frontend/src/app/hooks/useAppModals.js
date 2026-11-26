import { useState, useCallback } from "react";

/**
 * Custom hook to encapsulate global application modal overlay states and actions.
 */
export function useAppModals() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginMode, setLoginMode] = useState("login");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isOrderSuccessOpen, setIsOrderSuccessOpen] = useState(false);
  const [isCustomerDrawerOpen, setIsCustomerDrawerOpen] = useState(false);
  const [documentType, setDocumentType] = useState("Boleta");
  const [customerDocument, setCustomerDocument] = useState("");

  const openLogin = useCallback((mode = "login") => {
    setLoginMode(mode);
    setIsLoginOpen(true);
  }, []);

  const openOrderSuccess = useCallback(() => {
    setIsOrderSuccessOpen(true);
    setIsPaymentModalOpen(false);
  }, []);

  const openCustomerDrawer = useCallback(() => {
    setIsCustomerDrawerOpen(true);
  }, []);

  const closeCustomerDrawer = useCallback(() => {
    setIsCustomerDrawerOpen(false);
  }, []);

  return {
    isLoginOpen,
    setIsLoginOpen,
    loginMode,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isOrderSuccessOpen,
    setIsOrderSuccessOpen,
    isCustomerDrawerOpen,
    setIsCustomerDrawerOpen,
    documentType,
    setDocumentType,
    customerDocument,
    setCustomerDocument,
    openLogin,
    openOrderSuccess,
    openCustomerDrawer,
    closeCustomerDrawer
  };
}

export default useAppModals;

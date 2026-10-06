import { useState, useEffect, useCallback } from "react";
import { invoicesService } from "../invoicesService";

/**
 * Custom hook to manage Invoices state and operations
 */
export function useInvoices(autoLoad = true) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await invoicesService.fetchInvoices();
      if (Array.isArray(data)) {
        setInvoices(data);
      }
      return data;
    } catch (err) {
      console.error("Error loading invoices:", err);
      setError(err.message || "Error al cargar comprobantes");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelInvoice = useCallback(async (invoiceId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoicesService.cancelInvoice(invoiceId);
      if (result && result.success) {
        await loadInvoices();
      }
      return result;
    } catch (err) {
      console.error("Error canceling invoice:", err);
      setError(err.message || "Error al anular comprobante");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadInvoices]);

  const sendEmail = useCallback(async (invoiceId, email) => {
    try {
      return await invoicesService.sendEmail(invoiceId, email);
    } catch (err) {
      console.error("Error sending invoice email:", err);
      throw err;
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      loadInvoices();
    }
  }, [autoLoad, loadInvoices]);

  return {
    invoices,
    setInvoices,
    loading,
    error,
    loadInvoices,
    cancelInvoice,
    sendEmail
  };
}

export default useInvoices;

import { getInvoicesApi, sendInvoiceEmailApi, cancelInvoiceApi } from "./invoicesApi";
import { filterInvoices, calculateInvoiceMetrics, formatNextInvoiceNumber } from "./invoicesUtils";
import { generateInvoicePDF } from "@/utils/pdfGenerator";

/**
 * Invoices Domain Service Layer
 */
export const invoicesService = {
  /**
   * Fetches all invoices from the backend
   */
  async fetchInvoices() {
    try {
      const data = await getInvoicesApi();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("invoicesService.fetchInvoices error:", err);
      return [];
    }
  },

  /**
   * Cancels an existing invoice
   */
  async cancelInvoice(invoiceId) {
    return cancelInvoiceApi(invoiceId);
  },

  /**
   * Sends invoice via email
   */
  async sendEmail(invoiceId, email) {
    return sendInvoiceEmailApi(invoiceId, email);
  },

  /**
   * Generates PDF document for the invoice
   */
  generatePDF: generateInvoicePDF,

  /**
   * Filtering and calculation helpers
   */
  filterInvoices,
  calculateInvoiceMetrics,
  formatNextInvoiceNumber
};

// Compatibility export
export const invoiceService = invoicesService;
export default invoicesService;

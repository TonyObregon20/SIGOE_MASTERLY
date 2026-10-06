import { apiClient } from "@/services/api/apiClient";

/**
 * Invoices HTTP Communication Layer
 * Interacts with backend /api/invoices endpoints
 */

export async function getInvoicesApi() {
  return apiClient("/api/invoices");
}

export async function sendInvoiceEmailApi(payloadOrId, email) {
  const body = typeof payloadOrId === "object" && payloadOrId !== null
    ? payloadOrId
    : { invoiceId: payloadOrId, email };

  return apiClient("/api/invoices/send-email", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function cancelInvoiceApi(invoiceId) {
  return apiClient("/api/invoices/cancel", {
    method: "POST",
    body: JSON.stringify({ invoiceId })
  });
}


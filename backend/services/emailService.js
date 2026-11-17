import nodemailer from "nodemailer";

let transporter;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getTransporter() {
  const user = process.env.EMAIL_USER;
  const password = process.env.EMAIL_PASSWORD;

  if (!user || !password) {
    const error = new Error("El servicio de correo no está configurado.");
    error.code = "EMAIL_NOT_CONFIGURED";
    throw error;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass: password }
    });
  }

  return transporter;
}

export async function sendInvoiceEmail({ recipient, invoice, order, pdfBase64, pdfFileName }) {
  const items = (order.items || [])
    .map((item) => {
      const description = item.productName || item.name || "Prenda";
      const size = item.selectedSize ? ` - Talla ${item.selectedSize}` : "";
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.price || 0).toFixed(2);
      const lineTotal = (quantity * Number(item.price || 0)).toFixed(2);
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;color:#334155;font-size:14px;">
            ${escapeHtml(description)}${escapeHtml(size)}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;color:#334155;font-size:14px;text-align:center;">
            ${quantity}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;color:#334155;font-size:14px;text-align:right;">
            S/ ${unitPrice}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:700;text-align:right;">
            S/ ${lineTotal}
          </td>
        </tr>`;
    })
    .join("");
  const invoiceCode = escapeHtml(`${invoice.series || "B001"}-${invoice.number || "000001"}`);
  const orderId = escapeHtml(order.id);
  const customerName = escapeHtml(order.customerName || "Cliente");
  const total = Number(order.total || 0).toFixed(2);
  const sender = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  const attachments = pdfBase64
    ? [{
      filename: pdfFileName || `${invoiceCode}.pdf`,
      content: Buffer.from(pdfBase64, "base64"),
      contentType: "application/pdf"
    }]
    : [];

  await getTransporter().sendMail({
    from: sender,
    to: recipient,
    subject: "Comprobante de Venta - Masterly",
    text: [
      "Comprobante de Venta - Masterly",
      `Boleta: ${invoiceCode}`,
      `Orden: ${order.id}`,
      `Cliente: ${order.customerName || "Cliente"}`,
      `Total: S/ ${Number(order.total || 0).toFixed(2)}`,
      "Artículos:",
      ...(order.items || []).map((item) => `- ${item.quantity}x ${item.productName || "Prenda"}`)
    ].join("\n"),
    attachments,
    html: `
      <div style="margin:0;padding:24px 12px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#334155;">
        <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
          <div style="padding:30px 34px;background:#0f172a;text-align:center;">
            <div style="font-size:28px;line-height:1;font-weight:800;letter-spacing:1px;color:#ffffff;">MASTERLY</div>
            <div style="margin-top:9px;font-size:11px;letter-spacing:2px;color:#bfdbfe;">CONFECCIONES &amp; MODA TEXTIL</div>
          </div>

          <div style="padding:34px;">
            <h1 style="margin:0;color:#0f172a;font-size:24px;line-height:1.3;">Comprobante de Venta</h1>
            <p style="margin:10px 0 0;color:#64748b;font-size:14px;line-height:1.6;">
              Hola, ${customerName}. Gracias por tu compra. Te compartimos el resumen de tu boleta.
            </p>

            <div style="margin-top:26px;padding:20px;border-left:4px solid #2563eb;border-radius:10px;background:#eff6ff;">
              <div style="margin-bottom:14px;color:#0f172a;font-size:16px;font-weight:700;">Resumen de tu boleta</div>
              <div style="margin:8px 0;color:#475569;font-size:14px;">
                <strong style="color:#334155;">Boleta:</strong> ${invoiceCode}
              </div>
              <div style="margin:8px 0;color:#475569;font-size:14px;">
                <strong style="color:#334155;">Orden:</strong> ${orderId}
              </div>
              <div style="margin:8px 0;color:#475569;font-size:14px;">
                <strong style="color:#334155;">Cliente:</strong> ${customerName}
              </div>
              <div style="margin:14px 0 0;color:#2563eb;font-size:22px;font-weight:800;">
                Total: S/ ${total}
              </div>
            </div>

            <h2 style="margin:30px 0 12px;color:#0f172a;font-size:17px;">Detalle de tu compra</h2>
            <table role="presentation" style="width:100%;border-collapse:collapse;">
              <thead>
                <tr>
                  <th style="padding:10px 0;border-bottom:2px solid #2563eb;color:#64748b;font-size:11px;text-align:left;text-transform:uppercase;">Producto</th>
                  <th style="padding:10px 0;border-bottom:2px solid #2563eb;color:#64748b;font-size:11px;text-align:center;text-transform:uppercase;">Cant.</th>
                  <th style="padding:10px 0;border-bottom:2px solid #2563eb;color:#64748b;font-size:11px;text-align:right;text-transform:uppercase;">P. unit.</th>
                  <th style="padding:10px 0;border-bottom:2px solid #2563eb;color:#64748b;font-size:11px;text-align:right;text-transform:uppercase;">Importe</th>
                </tr>
              </thead>
              <tbody>${items || '<tr><td colspan="4" style="padding:16px 0;color:#64748b;font-size:14px;">Sin artículos registrados.</td></tr>'}</tbody>
            </table>

            <p style="margin:28px 0 0;color:#64748b;font-size:14px;line-height:1.6;">
              Encontrarás tu boleta completa en el archivo PDF adjunto a este correo.
            </p>
            <p style="margin:22px 0 0;color:#0f172a;font-size:14px;font-weight:700;">Gracias por confiar en Masterly.</p>
          </div>

          <div style="padding:22px 34px;border-top:1px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.7;text-align:center;">
            <div style="color:#334155;font-weight:700;">MASTERLY</div>
            <div>Av. Prolongación Gamarra 1120, La Victoria, Lima - Perú</div>
            <div>ventas@masterly.pe · +51 987 654 321</div>
          </div>
        </div>
      </div>
    `
  });
}

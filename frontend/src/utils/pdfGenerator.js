import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export function generateInvoicePDF(invoiceData) {
  const {
    docType = "Boleta",
    series = "B001",
    invoiceNumber = "000001",
    orderId = "ORD-0000",
    customerName = "Cliente General",
    docNumber = "00000000",
    items = [],
    total = 0,
    date = new Date().toISOString().split("T")[0],
    type = "direct",
    initialPayment = undefined
  } = invoiceData;

  const doc = new jsPDF();

  const fullSeries = series || (docType === "Factura" ? "F001" : "B001");
  const fullNum = invoiceNumber ? invoiceNumber.toString().padStart(6, "0") : "000001";
  const comprobanteTitle = docType === "Factura" ? "FACTURA ELECTRÓNICA" : "BOLETA DE VENTA ELECTRÓNICA";
  const comprobanteCode = `${fullSeries}-${fullNum}`;

  // Company Brand Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 38, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("MASTERLY", 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text("CONFECCIONES & MODA TEXTIL S.A.C.", 14, 24);
  doc.text("Av. Prolongación Gamarra 1120, La Victoria, Lima - Perú", 14, 29);
  doc.text("Email: ventas@masterly.pe | Tel: +51 987 654 321", 14, 34);

  // Document Box (RUC & Series)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(37, 99, 235); // blue-600
  doc.setLineWidth(0.8);
  doc.roundedRect(130, 6, 66, 26, 2, 2, "FD");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("R.U.C. N° 20601234567", 163, 13, { align: "center" });

  doc.setFillColor(37, 99, 235);
  doc.rect(130.5, 16, 65, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(comprobanteTitle, 163, 21.5, { align: "center" });

  doc.setTextColor(37, 99, 235);
  doc.setFontSize(10);
  doc.text(`N° ${comprobanteCode}`, 163, 29, { align: "center" });

  // Customer & Order Info Box
  let startY = 46;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, startY, 182, 34, 2, 2, "FD");

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.setFont("helvetica", "bold");
  doc.text("DATOS DEL CLIENTE Y OPERACIÓN", 18, startY + 7);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);

  doc.text(`Señor(es):`, 18, startY + 15);
  doc.setFont("helvetica", "bold");
  doc.text(`${customerName}`, 42, startY + 15);

  doc.setFont("helvetica", "normal");
  doc.text(`${docType === "Factura" ? "RUC" : "DNI/Doc"}:`, 18, startY + 22);
  doc.setFont("helvetica", "bold");
  doc.text(`${docNumber || "00000000"}`, 42, startY + 22);

  doc.setFont("helvetica", "normal");
  doc.text(`Tipo Venta:`, 18, startY + 29);
  doc.setFont("helvetica", "bold");
  doc.text(`${type === "pedido" ? 'A Pedido (Manufactura 50% Adelanto)' : 'Venta Directa de Stock'}`, 42, startY + 29);

  doc.setFont("helvetica", "normal");
  doc.text(`Fecha Emisión:`, 120, startY + 15);
  doc.setFont("helvetica", "bold");
  doc.text(`${date}`, 150, startY + 15);

  doc.setFont("helvetica", "normal");
  doc.text(`Código Pedido:`, 120, startY + 22);
  doc.setFont("helvetica", "bold");
  doc.text(`${orderId}`, 150, startY + 22);

  doc.setFont("helvetica", "normal");
  doc.text(`Moneda:`, 120, startY + 29);
  doc.setFont("helvetica", "bold");
  doc.text(`SOLES (S/)`, 150, startY + 29);

  // Table of Items
  const tableRows = items.map((it, idx) => {
    const qty = it.quantity || 1;
    const unitPrice = Number(it.price || 0);
    const itemTotal = qty * unitPrice;

    let desc = it.productName || it.name || `Prenda Masterly (ID: ${it.productId || 'P1'})`;
    if (it.selectedSize) desc += ` - Talla: ${it.selectedSize}`;
    if (it.sizeDistribution) {
      const dist = Object.entries(it.sizeDistribution)
        .map(([sz, q]) => `${sz}:${q}`)
        .join(" ");
      if (dist) desc += ` (${dist})`;
    }

    return [
      (idx + 1).toString(),
      desc,
      qty.toString(),
      `S/ ${unitPrice.toFixed(2)}`,
      `S/ ${itemTotal.toFixed(2)}`
    ];
  });

  autoTable(doc, {
    startY: startY + 38,
    head: [["#", "Descripción de Producto", "Cant.", "P. Unitario", "Importe Total"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "left"
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 102 },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 26, halign: "right" },
      4: { cellWidth: 26, halign: "right" }
    },
    margin: { left: 14, right: 14 }
  });

  // Calculate Totals & IGV
  const finalTableY = doc.lastAutoTable.finalY + 8;

  const subtotal = total / 1.18;
  const igv = total - subtotal;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(120, finalTableY, 76, 32, 2, 2, "FD");

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  doc.text("Op. Gravada:", 125, finalTableY + 8);
  doc.text(`S/ ${subtotal.toFixed(2)}`, 190, finalTableY + 8, { align: "right" });

  doc.text("I.G.V. (18%):", 125, finalTableY + 15);
  doc.text(`S/ ${igv.toFixed(2)}`, 190, finalTableY + 15, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("TOTAL IMPORTE:", 125, finalTableY + 25);
  doc.setTextColor(37, 99, 235);
  doc.text(`S/ ${total.toFixed(2)}`, 190, finalTableY + 25, { align: "right" });

  if (type === "pedido" && initialPayment) {
    doc.setFontSize(8);
    doc.setTextColor(37, 99, 235); // blue-600
    doc.text(`Adelanto Pagado (50%): S/ ${initialPayment.toFixed(2)}`, 14, finalTableY + 10);
    doc.setTextColor(217, 119, 6); // amber-600
    doc.text(`Saldo Pendiente (50%): S/ ${(total - initialPayment).toFixed(2)}`, 14, finalTableY + 16);
  }

  // Footer SUNAT note & QR simulation box
  const footerY = Math.max(finalTableY + 40, 250);
  doc.setDrawColor(226, 232, 240);
  doc.line(14, footerY, 196, footerY);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Esta es una representación impresa de la Boleta/Factura Electrónica emitida según normativa SUNAT.", 14, footerY + 6);
  doc.text("¡Gracias por confiar en la calidad textil y confección de MASTERLY!", 14, footerY + 11);

  // Save PDF
  doc.save(`${docType}_${comprobanteCode}.pdf`);
}

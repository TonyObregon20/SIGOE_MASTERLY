import React from "react";
import { ClipboardList, X, Printer } from "lucide-react";
import { motion } from "motion/react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Printable SUNAT electronic receipt preview modal with print & PDF generation
 */
export default function InvoiceDetailModal({ invoice, onClose }) {
  if (!invoice) return null;

  const handlePrintOrPdf = () => {
    const printContent = document.getElementById("printable-receipt");
    const windowUrl = "about:blank";
    const uniqueName = new Date().getTime();
    const printWindow = window.open(
      windowUrl,
      uniqueName,
      "left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0"
    );

    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Comprobante ${invoice.series}-${invoice.number}</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=JetBrains+Mono:wght@400;700;900&display=swap');
              body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 2rem 1rem; }
              .font-mono { font-family: 'JetBrains Mono', monospace; }
              @media print {
                .no-print { display: none !important; }
                body { background: white; padding: 0; }
                .print-container { border: none !important; box-shadow: none !important; }
              }
            </style>
          </head>
          <body>
            <div class="max-w-md mx-auto border bg-white shadow-md p-6 rounded-xl print-container">
              ${printContent?.innerHTML}
            </div>
            <div class="no-print mt-6 text-center">
              <button onclick="window.print()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs tracking-wider uppercase font-sans">
                Imprimir Comprobante
              </button>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
    } else {
      // Fallback jsPDF
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("MASTERLY S.A.C.", 105, 20, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Av. Larco 1230, Miraflores, Lima - Perú", 105, 26, { align: "center" });
      doc.text("RUC: 20123456789", 105, 31, { align: "center" });

      doc.setDrawColor(180, 180, 180);
      doc.rect(40, 38, 130, 22);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`R.U.C. 20123456789`, 105, 43, { align: "center" });
      doc.text(
        (invoice.type === "Factura"
          ? "FACTURA DE VENTA ELECTRÓNICA"
          : "BOLETA DE VENTA ELECTRÓNICA"
        ).toUpperCase(),
        105,
        49,
        { align: "center" }
      );
      doc.setFontSize(13);
      doc.setTextColor(79, 70, 229);
      doc.text(`${invoice.series}-${invoice.number}`, 105, 55, { align: "center" });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Adquiriente:", 20, 72);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.customerName || "", 50, 72);

      doc.setFont("helvetica", "bold");
      doc.text("N° Documento:", 20, 78);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.customerDocument || "", 50, 78);

      doc.setFont("helvetica", "bold");
      doc.text("Fecha Emisión:", 20, 84);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.date || "", 50, 84);

      doc.setFont("helvetica", "bold");
      doc.text("Estado SUNAT:", 20, 90);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.status || "", 50, 90);

      const tableRows = (invoice.items || []).map((item) => [
        item.productName || item.name || "Camisa Masterly",
        item.selectedSize || "-",
        (item.quantity || 0).toString(),
        `S/ ${Number(item.price || 0).toFixed(2)}`,
        `S/ ${((item.quantity || 0) * (item.price || 0)).toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: 96,
        head: [["Descripción", "Talla", "Cant", "P. Unitario", "Total"]],
        body: tableRows,
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 9 }
      });

      const finalY = (doc.lastAutoTable?.finalY || 100) + 10;

      doc.setFont("helvetica", "normal");
      doc.text("Subtotal (Op. Gravada):", 120, finalY);
      doc.text(
        `S/ ${(invoice.subtotal || invoice.total / 1.18).toFixed(2)}`,
        180,
        finalY,
        { align: "right" }
      );

      doc.text("I.G.V. (18%):", 120, finalY + 5);
      doc.text(
        `S/ ${(invoice.igv || invoice.total - invoice.total / 1.18).toFixed(2)}`,
        180,
        finalY + 5,
        { align: "right" }
      );

      doc.setFont("helvetica", "bold");
      doc.text("Total Neto (S/):", 120, finalY + 11);
      doc.text(`S/ ${Number(invoice.total || 0).toFixed(2)}`, 180, finalY + 11, {
        align: "right"
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(
        "Representación impresa de la boleta electrónica.",
        105,
        finalY + 25,
        { align: "center" }
      );
      doc.text("Gracias por su preferencia.", 105, finalY + 29, {
        align: "center"
      });

      doc.save(`Comprobante-${invoice.series}-${invoice.number}.pdf`);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden z-[160] flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white/10 p-1.5 rounded-lg text-indigo-400">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">
                Comprobante Electrónico
              </h3>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider">
                {invoice.series}-{invoice.number}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content */}
        <div
          id="printable-receipt"
          className="p-6 overflow-y-auto space-y-6 bg-slate-50/50 flex-1 text-slate-850"
        >
          {/* Logo & Corporate Header */}
          <div className="text-center space-y-1 border-b border-dashed border-slate-200 pb-4">
            <h2 className="font-serif italic font-black text-xl text-slate-900 tracking-wider">
              MASTERLY S.A.C.
            </h2>
            <p className="text-[10px] text-slate-500 font-medium">
              Av. Larco 1230, Miraflores, Lima - Perú
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              RUC: 20123456789
            </p>
          </div>

          {/* SUNAT Receipt Identification Box */}
          <div className="border border-slate-300 rounded-xl bg-white p-3.5 text-center space-y-1">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono">
              R.U.C. 20123456789
            </p>
            <h3 className="font-extrabold text-xs uppercase text-slate-900 tracking-wider font-sans">
              {invoice.type === "Factura"
                ? "FACTURA DE VENTA ELECTRÓNICA"
                : "BOLETA DE VENTA ELECTRÓNICA"}
            </h3>
            <p className="text-sm font-black text-indigo-600 font-mono tracking-tight">
              {invoice.series}-{invoice.number}
            </p>
          </div>

          {/* Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-xs font-mono border-b border-dashed border-slate-200 pb-4">
            <div>
              <span className="text-[9px] text-slate-400 font-bold block uppercase">
                Adquiriente
              </span>
              <span className="font-extrabold text-slate-800 break-words">
                {invoice.customerName}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-bold block uppercase">
                N° Documento (DNI/RUC)
              </span>
              <span className="font-bold text-slate-700">
                {invoice.customerDocument}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-bold block uppercase">
                Fecha de Emisión
              </span>
              <span className="font-bold text-slate-700">{invoice.date}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-bold block uppercase">
                Estado SUNAT
              </span>
              <span
                className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                  invoice.status === "Emitido"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : "bg-red-50 text-red-700 border border-red-100"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    invoice.status === "Emitido"
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-red-500"
                  }`}
                />
                {invoice.status}
              </span>
            </div>
          </div>

          {/* Product/Itemized Table */}
          <div className="space-y-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Detalle de Productos
            </span>
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
              <div className="grid grid-cols-12 bg-slate-100/80 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 font-mono border-b border-slate-200">
                <div className="col-span-6">Descripción</div>
                <div className="col-span-2 text-center">Cant</div>
                <div className="col-span-2 text-right">P.U.</div>
                <div className="col-span-2 text-right">Total</div>
              </div>
              <div className="divide-y divide-slate-100">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-12 px-3 py-2.5 items-center font-mono text-slate-700"
                    >
                      <div className="col-span-6 font-sans">
                        <span className="font-extrabold text-slate-900 text-xs block leading-tight">
                          {item.productName || item.name || "Camisa Masterly"}
                        </span>
                        {item.selectedSize && (
                          <span className="inline-block mt-0.5 text-[8px] font-black uppercase bg-blue-50 text-blue-600 px-1 py-0.2 rounded border border-blue-100">
                            Talla: {item.selectedSize}
                          </span>
                        )}
                        {item.sizeDistribution &&
                          Object.keys(item.sizeDistribution).length > 0 && (
                            <div className="flex flex-wrap gap-0.5 mt-0.5">
                              {Object.entries(item.sizeDistribution).map(
                                ([sz, qty]) =>
                                  qty > 0 && (
                                    <span
                                      key={sz}
                                      className="text-[8px] bg-slate-100 px-1 py-0.2 rounded border border-slate-200 text-slate-600"
                                    >
                                      T{sz}:{qty}
                                    </span>
                                  )
                              )}
                            </div>
                          )}
                      </div>
                      <div className="col-span-2 text-center text-slate-900 font-extrabold">
                        {item.quantity}
                      </div>
                      <div className="col-span-2 text-right text-slate-500">
                        S/ {Number(item.price || 0).toFixed(2)}
                      </div>
                      <div className="col-span-2 text-right font-black text-slate-900">
                        S/ {((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center italic text-slate-400">
                    Sin items en el comprobante
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Financial Totals */}
          <div className="flex justify-end font-mono">
            <div className="w-full sm:w-1/2 space-y-1.5 border-t border-dashed border-slate-200 pt-3 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal (Op. Gravada):</span>
                <span className="font-bold">
                  S/ {(invoice.subtotal || invoice.total / 1.18).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>I.G.V. (18%):</span>
                <span className="font-bold">
                  S/ {(invoice.igv || invoice.total - invoice.total / 1.18).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-900 font-black border-t border-slate-200 pt-1.5 text-sm">
                <span>Total Neto (S/):</span>
                <span className="text-indigo-600">
                  S/ {Number(invoice.total || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Legal compliance notice */}
          <div className="text-center space-y-1 pt-2 border-t border-dashed border-slate-200">
            <p className="text-[9px] text-slate-400 font-bold font-mono">
              Representación impresa de la {invoice.type === "Factura" ? "Factura" : "Boleta"} Electrónica.
            </p>
            <p className="text-[8px] text-slate-400 font-medium font-serif italic">
              Gracias por confiar en Masterly ERP. Esta es una transacción real simulada de manera legal.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex gap-3">
          <button
            type="button"
            onClick={handlePrintOrPdf}
            className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl border border-indigo-700/20 shadow-sm active:scale-95 transition-all cursor-pointer font-mono"
          >
            <Printer className="w-4 h-4" /> Imprimir / PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-xs active:scale-95 transition-transform cursor-pointer font-mono text-center"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

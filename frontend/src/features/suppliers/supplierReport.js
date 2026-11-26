
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const formatCurrency = (value) =>
  `S/ ${Number(value || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const formatDate = (date = new Date()) =>
  new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);

export function generateSupplierReport(supplier) {
  if (!supplier) {
    throw new Error("No se ha seleccionado un proveedor.");
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const isService =
    supplier.specialty !== "Insumos" && supplier.type !== "Insumos";

  const history = Array.isArray(supplier.history)
    ? supplier.history
    : [];

  const records = history.filter((record) =>
    isService
      ? record.type === "Servicio"
      : record.type === "Compra"
  );

  const recordCount = isService
    ? Number(supplier.servicesCount) || records.length
    : Number(supplier.purchasesCount) || records.length;

  const units = isService
    ? Number(supplier.totalUnitsProcessed) || 0
    : Number(supplier.totalUnitsPurchased) || 0;

  const totalSpent = Number(supplier.totalSpent) || 0;

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // Encabezado
  doc.setFillColor(22, 40, 65);
  doc.rect(0, 0, pageWidth, 42, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("COSEVICA", margin, 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("GESTION DE PROVEEDORES", margin, 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("REPORTE INDIVIDUAL", pageWidth - margin, 17, {
    align: "right"
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Generado: ${formatDate()}`, pageWidth - margin, 25, {
    align: "right"
  });

  // Identificación del proveedor
  let currentY = 54;

  doc.setTextColor(22, 40, 65);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("INFORMACION DEL PROVEEDOR", margin, currentY);

  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: "grid",
    head: [],
    body: [
      ["Razon social / Nombre", supplier.name || "No registrado"],
      [
        supplier.documentType || "Documento",
        supplier.documentNumber || "No registrado"
      ],
      ["Codigo interno", supplier.id || supplier._id || "No registrado"],
      ["Tipo", isService ? "Proveedor de servicios" : "Proveedor de insumos"],
      ["Especialidad", supplier.specialty || "No especificada"],
      ["Estado", supplier.status || "No especificado"],
      ["Contacto", supplier.contact || "No registrado"],
      ["Telefono", supplier.phone || "No registrado"],
      ["Correo electronico", supplier.email || "No registrado"],
      ["Direccion", supplier.address || "No registrada"]
    ],
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3,
      textColor: [55, 65, 81],
      lineColor: [220, 226, 232]
    },
    columnStyles: {
      0: {
        cellWidth: 52,
        fontStyle: "bold",
        textColor: [22, 40, 65],
        fillColor: [245, 247, 250]
      },
      1: {
        cellWidth: contentWidth - 52
      }
    }
  });

  // Indicadores
  currentY = doc.lastAutoTable.finalY + 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(22, 40, 65);
  doc.text("RESUMEN DE ACTIVIDAD", margin, currentY);

  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: "grid",
    head: [[
      "Indicador",
      "Resultado"
    ]],
    body: [
      [
        isService ? "Servicios registrados" : "Compras registradas",
        String(recordCount)
      ],
      [
        isService ? "Prendas procesadas" : "Unidades adquiridas",
        units.toLocaleString("es-PE")
      ],
      [
        "Inversion acumulada",
        formatCurrency(totalSpent)
      ]
    ],
    headStyles: {
      fillColor: [22, 40, 65],
      textColor: [255, 255, 255],
      fontStyle: "bold"
    },
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3,
      textColor: [55, 65, 81]
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.65 },
      1: {
        cellWidth: contentWidth * 0.35,
        halign: "right",
        fontStyle: "bold"
      }
    }
  });

  // Últimos registros: resumen de hasta cinco operaciones
  currentY = doc.lastAutoTable.finalY + 12;

  if (records.length > 0) {
    if (currentY > 235) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(22, 40, 65);
    doc.text("ULTIMOS REGISTROS", margin, currentY);

    const recentRecords = [...records]
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
      .slice(0, 5);

    autoTable(doc, {
      startY: currentY + 5,
      margin: { left: margin, right: margin },
      theme: "striped",
      head: [[
        "Fecha",
        "Referencia",
        "Descripcion",
        "Cantidad",
        "Costo"
      ]],
      body: recentRecords.map((record) => [
        record.date || "-",
        record.reference || "-",
        record.description || "-",
        `${Number(record.quantity) || 0} ${record.unit || ""}`,
        formatCurrency(record.totalCost)
      ]),
      headStyles: {
        fillColor: [22, 40, 65],
        textColor: [255, 255, 255],
        fontSize: 8
      },
      styles: {
        font: "helvetica",
        fontSize: 7.5,
        cellPadding: 2.5,
        overflow: "linebreak"
      },
      columnStyles: {
        0: { cellWidth: 23 },
        1: { cellWidth: 28 },
        2: { cellWidth: 67 },
        3: { cellWidth: 28 },
        4: { cellWidth: 28, halign: "right" }
      }
    });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(
      "Este proveedor aun no cuenta con registros de actividad.",
      margin,
      currentY + 2
    );
  }

  // Pie de página
  const pageCount = doc.internal.getNumberOfPages();

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);

    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setDrawColor(220, 226, 232);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 140);

    doc.text(
      "COSEVICA - Reporte individual de proveedor",
      margin,
      pageHeight - 9
    );

    doc.text(
      `Pagina ${page} de ${pageCount}`,
      pageWidth - margin,
      pageHeight - 9,
      { align: "right" }
    );
  }

  // Nombre seguro del archivo
  const safeName = (supplier.name || "proveedor")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .replace(/_+/g, "_");

  doc.save(`Reporte_Proveedor_${safeName}.pdf`);
}

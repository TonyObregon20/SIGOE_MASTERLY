import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Generates and downloads the Warehouse Movements PDF Report (Ingresos y Salidas)
 * with Order Traceability (ORD: Ingreso and Salida)
 */
export function generateWarehousePDF({
  movements = [],
  ordersData = [],
  products = [],
  kardex = [],
  summary = {
    totalIngresos: 0,
    totalSalidas: 0,
    saldoNeto: 0,
    totalOperaciones: 0
  },
  filters = {
    type: "Todos",
    datePreset: "Todo",
    search: ""
  }
}) {
  const doc = new jsPDF();

  // Header design
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("MASTERLY - REPORTE DE MOVIMIENTOS DE ALMACÉN", 14, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(
    `Fecha y hora de emisión: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}  |  Filtro Tipo: ${filters.type}  |  Periodo: ${filters.datePreset}`,
    14,
    26
  );
  doc.text("Trazabilidad por Pedido (ORD), Control de Ingresos, Salidas y Balance de Inventario", 14, 31);

  // Top decorative divider line
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.5);
  doc.line(14, 34, 196, 34);

  // 1. Resumen Ejecutivo (KPIs)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text("1. Resumen Consolidado de Almacén", 14, 42);

  autoTable(doc, {
    startY: 45,
    theme: "grid",
    headStyles: { fillColor: [30, 41, 59], fontStyle: "bold", halign: "left" },
    styles: { fontSize: 8, cellPadding: 2.5 },
    head: [["Indicador de Almacén", "Cantidad Total", "Descripción / Impacto"]],
    body: [
      [
        "Total Ingresos (Entradas)",
        `+${summary.totalIngresos} uds`,
        "Prendas recibidas de producción (OPs), autostock y ajustes"
      ],
      [
        "Total Salidas (Despachos)",
        `-${summary.totalSalidas} uds`,
        "Prendas despachadas por pedidos de clientes o traslados"
      ],
      [
        "Saldo Neto de Existencias",
        `${summary.saldoNeto >= 0 ? "+" : ""}${summary.saldoNeto} uds`,
        "Diferencial de flujo de inventario terminado en el periodo"
      ],
      [
        "Total de Operaciones Realizadas",
        `${summary.totalOperaciones} registros`,
        "Movimientos formales de ingreso y salida procesados"
      ]
    ]
  });

  // 2. Trazabilidad por Pedido (ORD): Ingreso y Salida
  const nextY1 = doc.lastAutoTable.finalY + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text("2. Trazabilidad por Pedido (ORD): Ingresos y Salidas Correspondientes", 14, nextY1);

  const orderRows = (ordersData.length > 0 ? ordersData : []).slice(0, 30).map((ord) => {
    const ingresosStr = ord.ingresos && ord.ingresos.length > 0
      ? ord.ingresos.map((i) => `${i.id} (+${i.quantity}u)`).join(", ")
      : "Pendiente";

    const salidasStr = ord.salidas && ord.salidas.length > 0
      ? ord.salidas.map((s) => `${s.id} (-${s.quantity}u)`).join(", ")
      : "Sin salida";

    const itemsStr = ord.items && ord.items.length > 0
      ? ord.items.map((i) => `${i.productName || "Prenda"} (${i.quantity}u)`).join(", ")
      : "Según pedido";

    const flujoStr = `+${ord.totalIngreso || 0}u / -${ord.totalSalida || 0}u (Saldo: ${ord.balance || 0}u)`;

    return [
      ord.date || "-",
      ord.orderId || "-",
      ord.orderType || "A Pedido",
      ingresosStr,
      salidasStr,
      itemsStr,
      flujoStr,
      ord.orderStatus || "Aceptado"
    ];
  });

  autoTable(doc, {
    startY: nextY1 + 4,
    theme: "striped",
    headStyles: { fillColor: [147, 51, 234], fontStyle: "bold" }, // purple-600
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 20, fontStyle: "bold" },
      2: { cellWidth: 18 },
      3: { cellWidth: 24 },
      4: { cellWidth: 24 },
      5: { cellWidth: 38 },
      6: { cellWidth: 24, halign: "right" },
      7: { cellWidth: 16 }
    },
    head: [["Fecha", "ORD / Pedido", "Tipo", "ID Ingreso", "ID Salida", "Prendas", "Flujo / Saldo", "Estado"]],
    body: orderRows.length > 0 ? orderRows : [["-", "-", "-", "-", "-", "Sin registros", "-", "-"]]
  });

  // 3. Detalle Cronológico de Movimientos
  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text("3. Movimientos Cronológicos de Almacén", 14, 20);

  const movementsRows = movements.slice(0, 35).map((m) => {
    const totalQty = Array.isArray(m.items)
      ? m.items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)
      : Number(m.quantity) || 0;

    const itemsSummary = Array.isArray(m.items) && m.items.length > 0
      ? m.items.map((i) => `${i.productName || "Prenda"} (${i.quantity}u)`).join(", ")
      : m.reason || "Operación regular";

    const ord = m.orderId ? `${m.orderId} (${m.originType || "A Pedido"})` : (m.originType || "Directo");
    const op = m.opId ? `OP: ${m.opId}` : "-";

    return [
      m.date || "-",
      ord,
      m.id || "WM",
      m.type || "Movimiento",
      op,
      itemsSummary,
      `${m.type === "Ingreso" ? "+" : "-"}${totalQty} uds`,
      m.status || "Aceptado"
    ];
  });

  autoTable(doc, {
    startY: 24,
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235], fontStyle: "bold" }, // blue-600
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 26, fontStyle: "bold" },
      2: { cellWidth: 18 },
      3: { cellWidth: 18, fontStyle: "bold" },
      4: { cellWidth: 20 },
      5: { cellWidth: 46 },
      6: { cellWidth: 20, halign: "right", fontStyle: "bold" },
      7: { cellWidth: 16 }
    },
    head: [["Fecha", "ORD / Pedido (Tipo)", "ID Operación", "Tipo", "OP Ref.", "Prendas", "Cantidad", "Estado"]],
    body: movementsRows.length > 0 ? movementsRows : [["-", "-", "-", "-", "-", "Sin movimientos", "-", "-"]]
  });

  // 4. Balance por Producto
  const nextY2 = doc.lastAutoTable.finalY + 8;
  if (nextY2 > 210) {
    doc.addPage();
  }
  const startYProd = nextY2 > 210 ? 20 : nextY2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text("4. Balance de Existencias por Producto", 14, startYProd);

  const productRows = products.map((p) => {
    const productKardex = kardex.filter((k) => k.productId === p.id);
    const prodIngresos = productKardex
      .filter((k) => k.type === "Ingreso")
      .reduce((sum, k) => sum + (Number(k.quantity) || 0), 0);
    const prodSalidas = productKardex
      .filter((k) => k.type === "Salida")
      .reduce((sum, k) => sum + (Number(k.quantity) || 0), 0);
    const net = prodIngresos - prodSalidas;

    return [
      p.id,
      p.name || "Prenda",
      p.category || "General",
      `${p.stockPhysical || 0} uds`,
      `+${prodIngresos} uds`,
      `-${prodSalidas} uds`,
      `${net >= 0 ? "+" : ""}${net} uds`,
      `S/ ${Number(p.price || 0).toFixed(2)}`
    ];
  });

  autoTable(doc, {
    startY: startYProd + 4,
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], fontStyle: "bold" }, // slate-900
    styles: { fontSize: 7.5, cellPadding: 2.2 },
    columnStyles: {
      0: { cellWidth: 14 },
      1: { cellWidth: 50, fontStyle: "bold" },
      2: { cellWidth: 24 },
      3: { cellWidth: 22, halign: "right" },
      4: { cellWidth: 20, halign: "right" },
      5: { cellWidth: 20, halign: "right" },
      6: { cellWidth: 18, halign: "right", fontStyle: "bold" },
      7: { cellWidth: 20, halign: "right" }
    },
    head: [["ID", "Producto", "Categoría", "Stock Físico", "Total Ingresos", "Total Salidas", "Neto", "Precio Unit."]],
    body: productRows
  });

  // Footer Signature Block
  const finalY = doc.lastAutoTable.finalY + 22;
  if (finalY < 250) {
    doc.setDrawColor(148, 163, 184); // slate-400
    doc.line(25, finalY, 85, finalY);
    doc.line(125, finalY, 185, finalY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("Responsable de Almacén", 55, finalY + 5, { align: "center" });
    doc.text("Firma y Sello de Recepción", 55, finalY + 9, { align: "center" });

    doc.text("Jefe de Operaciones / Supervisor", 155, finalY + 5, { align: "center" });
    doc.text("Control de Calidad e Inventarios", 155, finalY + 9, { align: "center" });
  }

  // Footer document note
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Documento Oficial de Control de Inventario y Almacén - Masterly ERP", 196, 285, { align: "right" });

  // Save PDF
  const filenameDate = new Date().toISOString().split("T")[0];
  doc.save(`Reporte_Almacen_Ingresos_y_Salidas_${filenameDate}.pdf`);
}

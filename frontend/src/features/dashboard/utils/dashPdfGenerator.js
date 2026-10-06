import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Generates and downloads the Production & Operations PDF Report
 */
export function generateProductionPDF({
  totalOPs,
  activeOPsCount,
  finishedOPsCount,
  totalUnitsInProcess,
  totalUnitsCompleted,
  totalProductionUnits,
  stageUnits,
  stageStats,
  sizeTally,
  lowStock,
  calculateReplenishQty
}) {
  const doc = new jsPDF();

  // Header design
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("REPORTE DE OPERACIONES Y PRODUCCIÓN", 14, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 26);
  doc.text("Modulo de Control de Produccion, Confección y Almacen", 14, 31);

  // Divider line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(14, 34, 196, 34);

  // 1. Resumen General Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text("1. Resumen General de Operaciones", 14, 43);

  autoTable(doc, {
    startY: 47,
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235], fontStyle: "bold" }, // blue-600
    styles: { fontSize: 9, cellPadding: 3 },
    head: [["Métrica / Indicador", "Valor", "Detalle de Estado"]],
    body: [
      ["Total Órdenes de Producción (OPs)", `${totalOPs} órdenes`, "Acumulado histórico registrado"],
      ["OPs Activas en Taller", `${activeOPsCount} órdenes`, "En proceso de confección activo"],
      ["OPs Finalizadas", `${finishedOPsCount} órdenes`, "Listas en almacén de producto terminado"],
      ["Volumen en Proceso Activo", `${totalUnitsInProcess} uds`, "Unidades distribuidas en taller"],
      ["Volumen Completado e Histórico", `${totalUnitsCompleted} uds`, "Unidades confeccionadas finalizadas"],
      ["Volumen Total de Producción", `${totalProductionUnits} uds`, "Suma de unidades en proceso y completadas"]
    ]
  });

  // 2. Carga por Etapas Section
  const nextY1 = doc.lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text("2. Carga por Etapas de Confección", 14, nextY1);

  const stageRows = [
    { name: "Tendido" },
    { name: "Corte" },
    { name: "Costura" },
    { name: "Limpieza" },
    { name: "Planchado y Empaquetado" },
    { name: "Finalizado" }
  ].map((stg) => {
    const count = stageUnits[stg.name] || 0;
    const opCount = stageStats[stg.name] || 0;
    const pct = totalProductionUnits > 0 ? `${Math.round((count / totalProductionUnits) * 100)}%` : "0%";
    return [stg.name, `${count} uds`, `${opCount} OPs`, pct];
  });

  autoTable(doc, {
    startY: nextY1 + 4,
    theme: "grid",
    headStyles: { fillColor: [79, 70, 229], fontStyle: "bold" }, // indigo-600
    styles: { fontSize: 9, cellPadding: 3 },
    head: [["Etapa de Confección", "Unidades en Taller", "Cantidad de OPs", "Carga Relativa (%)"]],
    body: stageRows
  });

  // 3. Distribucion por Tallas Section
  const nextY2 = doc.lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text("3. Distribución y Volumen por Tallas", 14, nextY2);

  const sizeRows = Object.entries(sizeTally).map(([sz, qty]) => {
    const pct = totalProductionUnits > 0 ? `${Math.round((qty / totalProductionUnits) * 100)}%` : "0%";
    return [`Talla ${sz}`, `${qty} uds`, pct];
  });

  autoTable(doc, {
    startY: nextY2 + 4,
    theme: "grid",
    headStyles: { fillColor: [13, 148, 136], fontStyle: "bold" }, // teal-600
    styles: { fontSize: 9, cellPadding: 3 },
    head: [["Talla", "Unidades Producidas", "Porcentaje de Distribución (%)"]],
    body: sizeRows
  });

  // 4. Stock Critico Section
  const nextY3 = doc.lastAutoTable.finalY + 10;
  let startYForCritical = nextY3 + 4;

  if (nextY3 > 220) {
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("4. Alertas de Stock Crítico (Autostock)", 14, 20);
    startYForCritical = 24;
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("4. Alertas de Stock Crítico (Autostock)", 14, nextY3);
  }

  if (lowStock.length === 0) {
    doc.setFont("helvetica", "oblique");
    doc.setFontSize(10);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text("No se registran productos con niveles de inventario por debajo del mínimo.", 14, startYForCritical + 4);
  } else {
    const stockRows = lowStock.map((p) => {
      const currentStock = p.stockPhysical - p.stockCommitted;
      const replenish = calculateReplenishQty(p);
      return [
        p.name,
        `${p.minStock} uds`,
        `${currentStock} uds`,
        `+${replenish} uds`
      ];
    });

    autoTable(doc, {
      startY: startYForCritical,
      theme: "grid",
      headStyles: { fillColor: [220, 38, 38], fontStyle: "bold" }, // red-600
      styles: { fontSize: 9, cellPadding: 3 },
      head: [["Producto en Alerta", "Mínimo de Seguridad", "Stock Real Disponible", "Producción Sugerida"]],
      body: stockRows
    });
  }

  // Page footer layout
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Página ${i} de ${pageCount}`, 14, 285);
    doc.text("Documento Oficial - Módulo de Reportes de Confección", 196, 285, { align: "right" });
  }

  doc.save(`Reporte_Produccion_y_Operaciones_${new Date().toISOString().split("T")[0]}.pdf`);
}

/**
 * Generates and downloads the Sales & Clients PDF Report
 */
export function generateSalesPDF({
  totalSales,
  totalShirtsSold,
  clientRankings,
  productRankings,
  orders
}) {
  const doc = new jsPDF();

  doc.setFillColor(31, 41, 55); // Slate 800
  doc.rect(0, 0, 210, 25, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("MASTERLY - REPORTE DE VENTAS Y CLIENTES", 14, 16);

  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generado el: ${new Date().toLocaleString()}`, 140, 16);

  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Resumen de Indicadores Clave", 14, 38);

  const kpiHeaders = [["Indicador", "Valor"]];
  const kpiRows = [
    ["Ventas Totales en Soles", `S/ ${totalSales.toLocaleString()}`],
    ["Camisas Totales Vendidas", `${totalShirtsSold} unidades`],
    ["Cartera de Clientes Activos", `${clientRankings.length} clientes`],
    ["Ticket Promedio por Pedido", orders.length > 0 ? `S/ ${Math.round(totalSales / orders.length).toLocaleString()}` : "S/ 0"]
  ];

  autoTable(doc, {
    startY: 42,
    head: kpiHeaders,
    body: kpiRows,
    theme: "striped",
    headStyles: { fillColor: [16, 185, 129], fontStyle: "bold" }, // emerald-500
    styles: { fontSize: 10, cellPadding: 3 },
    margin: { left: 14, right: 14 }
  });

  const nextY1 = doc.lastAutoTable.finalY || 80;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Ranking de Compras por Cliente", 14, nextY1 + 10);

  const clientHeaders = [["Nombre del Cliente", "Total Comprado (S/)", "N° de Pedidos", "Camisas Compradas"]];
  const clientRows = clientRankings.map((c) => [
    c.name,
    `S/ ${c.spent.toLocaleString()}`,
    `${c.ordersCount} pedidos`,
    `${c.itemsCount} uds`
  ]);

  autoTable(doc, {
    startY: nextY1 + 14,
    head: clientHeaders,
    body: clientRows,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246], fontStyle: "bold" }, // blue-500
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: 14, right: 14 }
  });

  const nextY2 = doc.lastAutoTable.finalY || 140;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Ventas por Línea de Producto", 14, nextY2 + 10);

  const productHeaders = [["ID", "Nombre de Producto", "Unidades Vendidas", "Ingresos Generados"]];
  const productRows = productRankings.map((p) => [
    p.id,
    p.name,
    `${p.qty} uds`,
    `S/ ${p.revenue.toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: nextY2 + 14,
    head: productHeaders,
    body: productRows,
    theme: "striped",
    headStyles: { fillColor: [99, 102, 241], fontStyle: "bold" }, // indigo-500
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: 14, right: 14 }
  });

  doc.save(`Reporte_Ventas_y_Clientes_${new Date().toISOString().split("T")[0]}.pdf`);
}

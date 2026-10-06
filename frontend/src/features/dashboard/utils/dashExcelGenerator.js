/**
 * Generates and downloads the Production & Operations Excel/CSV Report
 */
export function generateProductionExcel({
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
  let csvContent = "sep=;\n"; // Excel compatibility tag

  const addRow = (cols) => {
    csvContent += cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";") + "\n";
  };

  // Header
  addRow(["REPORTE DE OPERACIONES Y PRODUCCIÓN (AUTOSTOCK)"]);
  addRow(["Fecha de emisión", `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`]);
  addRow([]);

  // Section 1
  addRow(["1. RESUMEN GENERAL"]);
  addRow(["Indicador / Métrica", "Valor", "Detalle de Estado"]);
  addRow(["Total Órdenes de Producción (OPs)", `${totalOPs} órdenes`, "Acumulado histórico registrado"]);
  addRow(["OPs Activas en Taller", `${activeOPsCount} órdenes`, "En proceso de confección activo"]);
  addRow(["OPs Finalizadas", `${finishedOPsCount} órdenes`, "Listas en almacén de producto terminado"]);
  addRow(["Volumen en Proceso Activo", `${totalUnitsInProcess} uds`, "Unidades distribuidas en taller"]);
  addRow(["Volumen Completado e Histórico", `${totalUnitsCompleted} uds`, "Unidades confeccionadas finalizadas"]);
  addRow(["Volumen Total de Producción", `${totalProductionUnits} uds`, "Suma de unidades en proceso y completadas"]);
  addRow([]);

  // Section 2
  addRow(["2. CARGA POR ETAPAS DE CONFECCIÓN"]);
  addRow(["Etapa de Confección", "Unidades en Taller", "Cantidad de OPs", "Carga Relativa (%)"]);
  [
    "Tendido",
    "Corte",
    "Costura",
    "Limpieza",
    "Planchado y Empaquetado",
    "Finalizado"
  ].forEach((name) => {
    const count = stageUnits[name] || 0;
    const opCount = stageStats[name] || 0;
    const pct = totalProductionUnits > 0 ? `${Math.round((count / totalProductionUnits) * 100)}%` : "0%";
    addRow([name, `${count} uds`, `${opCount} OPs`, pct]);
  });
  addRow([]);

  // Section 3
  addRow(["3. DISTRIBUCIÓN Y VOLUMEN POR TALLAS"]);
  addRow(["Talla", "Unidades Producidas", "Porcentaje de Distribución (%)"]);
  Object.entries(sizeTally).forEach(([sz, qty]) => {
    const pct = totalProductionUnits > 0 ? `${Math.round((qty / totalProductionUnits) * 100)}%` : "0%";
    addRow([`Talla ${sz}`, `${qty} uds`, pct]);
  });
  addRow([]);

  // Section 4
  addRow(["4. ALERTAS DE STOCK CRÍTICO (AUTOSTOCK)"]);
  if (lowStock.length === 0) {
    addRow(["No se registran productos con niveles de inventario por debajo del mínimo."]);
  } else {
    addRow(["Producto en Alerta", "Mínimo de Seguridad", "Stock Real Disponible", "Producción Sugerida"]);
    lowStock.forEach((p) => {
      const currentStock = p.stockPhysical - p.stockCommitted;
      const replenish = calculateReplenishQty(p);
      addRow([p.name, `${p.minStock} uds`, `${currentStock} uds`, `+${replenish} uds`]);
    });
  }

  // Create Blob with UTF-8 BOM to preserve accents in Excel
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Reporte_Produccion_y_Operaciones_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates and downloads the Sales & Clients Excel/CSV Report
 */
export function generateSalesExcel({
  totalSales,
  totalShirtsSold,
  clientRankings,
  productRankings,
  orders
}) {
  let csvContent = "data:text/csv;charset=utf-8,";
  const addRow = (arr) => {
    const sanitized = arr.map((val) => {
      if (typeof val === "string") {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvContent += sanitized.join(",") + "\r\n";
  };

  addRow(["REPORTE GENERAL DE VENTAS E INGRESOS"]);
  addRow(["Generado el", new Date().toLocaleString()]);
  addRow([]);

  addRow(["RESUMEN DE INDICADORES CLAVE"]);
  addRow(["Indicador", "Valor"]);
  addRow(["Ventas Totales", `S/ ${totalSales.toLocaleString()}`]);
  addRow(["Camisas Totales Vendidas", `${totalShirtsSold} uds`]);
  addRow(["Clientes Activos", `${clientRankings.length}`]);
  addRow(["Ticket Promedio", orders.length > 0 ? `S/ ${Math.round(totalSales / orders.length)}` : "S/ 0"]);
  addRow([]);

  addRow(["VENTAS POR CLIENTE (RANKING DE COMPRAS)"]);
  addRow(["Nombre del Cliente", "Monto Gastado (S/)", "Cantidad de Pedidos", "Camisas Compradas"]);
  clientRankings.forEach((c) => {
    addRow([c.name, c.spent, c.ordersCount, c.itemsCount]);
  });
  addRow([]);

  addRow(["VENTAS POR PRODUCTO"]);
  addRow(["Producto", "Unidades Vendidas", "Ingresos Generados (S/)"]);
  productRankings.forEach((p) => {
    addRow([p.name, p.qty, p.revenue]);
  });
  addRow([]);

  addRow(["HISTORIAL CRONOLÓGICO DE TRANSACCIONES"]);
  addRow(["ID Orden", "Fecha", "Cliente", "Tipo", "Estado", "Monto Total (S/)"]);
  if (orders.length === 0) {
    addRow(["No hay registros de órdenes registradas"]);
  } else {
    orders.forEach((o) => {
      addRow([o.id, o.date, o.customerName, o.type === "pedido" ? "A Pedido" : "Directa", o.status, o.total]);
    });
  }

  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Reporte_Ventas_y_Clientes_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

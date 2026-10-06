/**
 * Generates and downloads the Warehouse Movements Excel/CSV Report (Ingresos y Salidas)
 * with Order Traceability (ORD: Ingresos y Salidas vinculadas)
 */
export function generateWarehouseExcel({
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
  let csvContent = "\uFEFFsep=;\n"; // UTF-8 BOM + Excel separator

  const addRow = (cols) => {
    csvContent += cols.map((c) => `"${String(c !== undefined && c !== null ? c : "").replace(/"/g, '""')}"`).join(";") + "\n";
  };

  // Header Title
  addRow(["MASTERLY - REPORTE DE MOVIMIENTOS DE ALMACÉN (INGRESOS Y SALIDAS)"]);
  addRow(["Fecha de emisión", `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`]);
  addRow(["Filtro Tipo", filters.type]);
  addRow(["Periodo", filters.datePreset]);
  addRow([]);

  // Section 1: Executive Summary
  addRow(["1. RESUMEN CONSOLIDADO DE MOVIMIENTOS"]);
  addRow(["Indicador", "Cantidad Total", "Impacto"]);
  addRow(["Total Ingresos (Entradas)", `+${summary.totalIngresos} uds`, "Prendas recibidas de producción (OPs), autostock y ajustes"]);
  addRow(["Total Salidas (Despachos)", `-${summary.totalSalidas} uds`, "Prendas despachadas por pedidos o traslados"]);
  addRow(["Saldo Neto del Periodo", `${summary.saldoNeto >= 0 ? "+" : ""}${summary.saldoNeto} uds`, "Diferencial neto de existencias terminadas"]);
  addRow(["Total de Operaciones", `${summary.totalOperaciones} registros`, "Operaciones formales registradas"]);
  addRow([]);

  // Section 2: Order Traceability (ORD: Ingresos y Salidas)
  addRow(["2. TRAZABILIDAD POR PEDIDO (ORD) - INGRESOS Y SALIDAS CORRESPONDIENTES"]);
  addRow([
    "Fecha",
    "ORD / Pedido",
    "Tipo de Orden",
    "OP Vinculada",
    "ID Ingreso Almacén",
    "Cantidad Ingresada (+uds)",
    "ID Salida Almacén",
    "Cantidad Salida (-uds)",
    "Saldo en Almacén (uds)",
    "Prendas y Modelos",
    "Estado de la Orden"
  ]);

  (ordersData.length > 0 ? ordersData : []).forEach((ord) => {
    const ingresosStr = ord.ingresos && ord.ingresos.length > 0
      ? ord.ingresos.map((i) => i.id).join(", ")
      : "Pendiente";

    const salidasStr = ord.salidas && ord.salidas.length > 0
      ? ord.salidas.map((s) => s.id).join(", ")
      : "Sin salida";

    const itemsStr = ord.items && ord.items.length > 0
      ? ord.items.map((i) => `${i.productName || "Prenda"} (${i.quantity}u)`).join(" | ")
      : "Según pedido";

    addRow([
      ord.date || "-",
      ord.orderId || "-",
      ord.orderType || "A Pedido",
      ord.opId || "-",
      ingresosStr,
      ord.totalIngreso || 0,
      salidasStr,
      ord.totalSalida || 0,
      ord.balance || 0,
      itemsStr,
      ord.orderStatus || "Aceptado"
    ]);
  });
  addRow([]);

  // Section 3: Movements List
  addRow(["3. DETALLE CRONOLÓGICO DE MOVIMIENTOS"]);
  addRow([
    "Fecha",
    "ORD / Pedido",
    "Tipo de Orden",
    "ID Operación",
    "Tipo de Movimiento",
    "OP Vinculada",
    "Detalle de Productos / Prendas",
    "Cantidad Total (Uds)",
    "Estado de Almacén",
    "Fecha Creación"
  ]);

  movements.forEach((m) => {
    const totalQty = Array.isArray(m.items)
      ? m.items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)
      : Number(m.quantity) || 0;

    const itemsSummary = Array.isArray(m.items) && m.items.length > 0
      ? m.items.map((i) => `${i.productName || "Prenda"} (${i.quantity}u)`).join(" | ")
      : m.reason || "Operación regular";

    addRow([
      m.date || "-",
      m.orderId || (m.originType === "Autostock" ? "Autostock" : "Directo"),
      m.originType || "General",
      m.id || "WM",
      m.type || "-",
      m.opId || "-",
      itemsSummary,
      m.type === "Ingreso" ? totalQty : -totalQty,
      m.status || "Aceptado",
      m.createdAt ? m.createdAt.replace("T", " ").split(".")[0] : "-"
    ]);
  });
  addRow([]);

  // Section 4: Summary per product
  addRow(["4. BALANCE DE INGRESOS Y SALIDAS POR PRODUCTO"]);
  addRow([
    "ID Producto",
    "Nombre de Prenda",
    "Categoría",
    "Stock Físico Actual (Uds)",
    "Total Ingresos Acumulados (Uds)",
    "Total Salidas Acumuladas (Uds)",
    "Saldo Neto Acumulado (Uds)",
    "Precio Venta (S/)"
  ]);

  products.forEach((p) => {
    const productKardex = kardex.filter((k) => k.productId === p.id);
    const prodIngresos = productKardex
      .filter((k) => k.type === "Ingreso")
      .reduce((sum, k) => sum + (Number(k.quantity) || 0), 0);
    const prodSalidas = productKardex
      .filter((k) => k.type === "Salida")
      .reduce((sum, k) => sum + (Number(k.quantity) || 0), 0);
    const net = prodIngresos - prodSalidas;

    addRow([
      p.id,
      p.name || "Prenda",
      p.category || "General",
      p.stockPhysical || 0,
      prodIngresos,
      prodSalidas,
      net,
      Number(p.price || 0).toFixed(2)
    ]);
  });

  // Download Trigger
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  const filenameDate = new Date().toISOString().split("T")[0];

  link.setAttribute("href", url);
  link.setAttribute("download", `Reporte_Almacen_Ingresos_y_Salidas_${filenameDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

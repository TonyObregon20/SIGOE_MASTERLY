import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileSpreadsheet,
  X,
  Package,
  Truck,
  TrendingUp,
  Download,
  Printer,
  Calendar,
  Search,
  Filter,
  Layers,
  FileText,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShoppingBag
} from "lucide-react";
import { generateWarehousePDF } from "../utils/warehousePdfGenerator";
import { generateWarehouseExcel } from "../utils/warehouseExcelGenerator";

/**
 * Modal to display comprehensive Warehouse Movements Report
 * Organized by Order (ORD: Ingresos and Salidas) and by Movements
 */
export default function WarehouseReportModal({
  isOpen,
  onClose,
  warehouseMovements = [],
  kardex = [],
  products = [],
  orders = [],
  productionOrders = []
}) {
  const [activeTab, setActiveTab] = useState("orders"); // "orders", "general", "products", "kardex"
  const [typeFilter, setTypeFilter] = useState("Todos"); // "Todos", "Ingreso", "Salida"
  const [orderTypeFilter, setOrderTypeFilter] = useState("Todos"); // "Todos", "A Pedido", "Directo"
  const [datePreset, setDatePreset] = useState("Todo"); // "Todo", "Hoy", "7dias", "mes", "custom"
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedProductId, setExpandedProductId] = useState(null);

  // Normalize raw movements into clean unified format
  const normalizedMovements = useMemo(() => {
    return (warehouseMovements || []).map((m) => {
      const totalQty = Array.isArray(m.items)
        ? m.items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)
        : Number(m.quantity) || 0;

      // Determine effective orderId
      let resolvedOrderId = m.orderId || "";
      if (!resolvedOrderId && m.opId) {
        const matchedOp = (productionOrders || []).find((op) => op.id === m.opId);
        if (matchedOp && matchedOp.orderId) {
          resolvedOrderId = matchedOp.orderId;
        }
      }

      const isDirect =
        m.originType?.includes("Direct") ||
        m.originType === "Venta Directa" ||
        (!resolvedOrderId && !m.opId);
      const isAutostock = m.originType === "Autostock";

      const effectiveOrigin = isAutostock
        ? "Autostock"
        : isDirect
        ? "Directo"
        : m.originType || "A Pedido";

      return {
        id: m.id || "WM",
        type: m.type || "Ingreso",
        originType: effectiveOrigin,
        status: m.status || "Aceptado",
        opId: m.opId || "",
        orderId: resolvedOrderId,
        date: m.date || (m.createdAt ? m.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]),
        items: Array.isArray(m.items) ? m.items : [],
        totalQuantity: totalQty,
        reason: m.reason || (m.type === "Ingreso" ? `Ingreso de almacén ${m.opId || ""}` : `Salida de almacén ${m.orderId || ""}`)
      };
    });
  }, [warehouseMovements, productionOrders]);

  // Group movements by Order (ORD) showing both Ingreso and Salida
  const ordersTraceability = useMemo(() => {
    const map = new Map();

    normalizedMovements.forEach((m) => {
      const orderKey = m.orderId || (m.originType === "Autostock" ? "Autostock" : `Directo-${m.id}`);
      const orderType = m.originType === "Autostock" ? "Autostock" : m.orderId ? m.originType || "A Pedido" : "Directo";

      if (!map.has(orderKey)) {
        const rawOrder = (orders || []).find((o) => o.id === orderKey);

        map.set(orderKey, {
          orderId: orderKey,
          orderType,
          date: m.date || (rawOrder?.date) || "",
          customer: rawOrder?.client || rawOrder?.customer || "",
          opId: m.opId || (rawOrder?.opId) || "",
          ingresos: [],
          salidas: [],
          items: [],
          totalIngreso: 0,
          totalSalida: 0,
          status: m.status || "Aceptado"
        });
      }

      const entry = map.get(orderKey);

      // Keep latest or valid date
      if (m.date && (!entry.date || m.date > entry.date)) {
        entry.date = m.date;
      }
      if (m.opId && !entry.opId) {
        entry.opId = m.opId;
      }

      if (m.type === "Ingreso") {
        entry.ingresos.push({
          id: m.id,
          quantity: m.totalQuantity,
          date: m.date,
          status: m.status,
          opId: m.opId,
          items: m.items
        });
        entry.totalIngreso += m.totalQuantity;
      } else if (m.type === "Salida") {
        entry.salidas.push({
          id: m.id,
          quantity: m.totalQuantity,
          date: m.date,
          status: m.status,
          items: m.items
        });
        entry.totalSalida += m.totalQuantity;
      }

      // Merge items
      (m.items || []).forEach((item) => {
        const itemKey = `${item.productId || ""}-${item.productName || ""}`;
        const existing = entry.items.find(
          (i) => `${i.productId || ""}-${i.productName || ""}` === itemKey
        );
        if (existing) {
          existing.quantity = (Number(existing.quantity) || 0) + (Number(item.quantity) || 0);
        } else {
          entry.items.push({ ...item });
        }
      });
    });

    const list = Array.from(map.values()).map((row) => {
      let orderStatus = "Completado";
      if (row.totalIngreso > 0 && row.totalSalida >= row.totalIngreso) {
        orderStatus = "Completado";
      } else if (row.totalIngreso > 0 && row.totalSalida === 0) {
        orderStatus = "En Almacén";
      } else if (row.totalIngreso > 0 && row.totalSalida < row.totalIngreso) {
        orderStatus = "Despacho Parcial";
      } else if (row.totalIngreso === 0 && row.totalSalida > 0) {
        orderStatus = "Salida Directa";
      } else if (row.totalIngreso === 0 && row.totalSalida === 0) {
        orderStatus = "Pendiente";
      }

      return {
        ...row,
        balance: row.totalIngreso - row.totalSalida,
        orderStatus
      };
    });

    return list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [normalizedMovements, orders]);

  // Filtered movements based on active filters
  const filteredMovements = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

    return normalizedMovements.filter((m) => {
      // Type filter
      if (typeFilter !== "Todos" && m.type !== typeFilter) return false;

      // Order Type filter
      if (orderTypeFilter !== "Todos") {
        if (orderTypeFilter === "A Pedido" && m.originType !== "A Pedido") return false;
        if (orderTypeFilter === "Directo" && m.originType !== "Directo" && m.originType !== "Venta Directa") return false;
      }

      // Date preset filter
      if (datePreset === "Hoy" && m.date !== today) return false;
      if (datePreset === "7dias" && m.date < sevenDaysAgo) return false;
      if (datePreset === "mes" && m.date < firstDayOfMonth) return false;
      if (datePreset === "custom") {
        if (customStartDate && m.date < customStartDate) return false;
        if (customEndDate && m.date > customEndDate) return false;
      }

      // Product filter
      if (selectedProductId !== "Todos") {
        const hasProduct = m.items.some(
          (i) => String(i.productId) === String(selectedProductId)
        );
        if (!hasProduct) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = m.id?.toLowerCase().includes(q);
        const matchesOp = m.opId?.toLowerCase().includes(q);
        const matchesOrder = m.orderId?.toLowerCase().includes(q);
        const matchesReason = m.reason?.toLowerCase().includes(q);
        const matchesItem = m.items.some((i) => i.productName?.toLowerCase().includes(q));
        if (!matchesId && !matchesOp && !matchesOrder && !matchesReason && !matchesItem) {
          return false;
        }
      }

      return true;
    });
  }, [normalizedMovements, typeFilter, orderTypeFilter, datePreset, customStartDate, customEndDate, selectedProductId, searchQuery]);

  // Filtered orders traceability list
  const filteredOrders = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

    return ordersTraceability.filter((ord) => {
      // Type filter (Ingreso / Salida)
      if (typeFilter === "Ingreso" && ord.ingresos.length === 0) return false;
      if (typeFilter === "Salida" && ord.salidas.length === 0) return false;

      // Order type filter
      if (orderTypeFilter !== "Todos") {
        if (orderTypeFilter === "A Pedido" && ord.orderType !== "A Pedido") return false;
        if (orderTypeFilter === "Directo" && ord.orderType !== "Directo") return false;
      }

      // Date preset
      if (datePreset === "Hoy" && ord.date !== today) return false;
      if (datePreset === "7dias" && ord.date < sevenDaysAgo) return false;
      if (datePreset === "mes" && ord.date < firstDayOfMonth) return false;
      if (datePreset === "custom") {
        if (customStartDate && ord.date < customStartDate) return false;
        if (customEndDate && ord.date > customEndDate) return false;
      }

      // Product filter
      if (selectedProductId !== "Todos") {
        const hasProd = ord.items.some((i) => String(i.productId) === String(selectedProductId));
        if (!hasProd) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesOrder = ord.orderId?.toLowerCase().includes(q);
        const matchesOp = ord.opId?.toLowerCase().includes(q);
        const matchesIngreso = ord.ingresos.some((i) => i.id?.toLowerCase().includes(q));
        const matchesSalida = ord.salidas.some((s) => s.id?.toLowerCase().includes(q));
        const matchesItem = ord.items.some((it) => it.productName?.toLowerCase().includes(q));
        if (!matchesOrder && !matchesOp && !matchesIngreso && !matchesSalida && !matchesItem) {
          return false;
        }
      }

      return true;
    });
  }, [ordersTraceability, typeFilter, orderTypeFilter, datePreset, customStartDate, customEndDate, selectedProductId, searchQuery]);

  // Overall KPIs
  const summaryMetrics = useMemo(() => {
    let totalIngresos = 0;
    let totalSalidas = 0;

    filteredMovements.forEach((m) => {
      if (m.type === "Ingreso") {
        totalIngresos += m.totalQuantity;
      } else if (m.type === "Salida") {
        totalSalidas += m.totalQuantity;
      }
    });

    const saldoNeto = totalIngresos - totalSalidas;
    const totalOperaciones = filteredMovements.length;
    const totalPedidos = filteredOrders.length;

    return {
      totalIngresos,
      totalSalidas,
      saldoNeto,
      totalOperaciones,
      totalPedidos
    };
  }, [filteredMovements, filteredOrders]);

  // Product balance metrics (incorporating movements and kardex)
  const productSummaries = useMemo(() => {
    return products.map((p) => {
      const prodKardex = (kardex || []).filter((k) => String(k.productId) === String(p.id));
      const totalIngresos = prodKardex
        .filter((k) => k.type === "Ingreso")
        .reduce((sum, k) => sum + (Number(k.quantity) || 0), 0);
      const totalSalidas = prodKardex
        .filter((k) => k.type === "Salida")
        .reduce((sum, k) => sum + (Number(k.quantity) || 0), 0);
      const net = totalIngresos - totalSalidas;

      const productMovements = normalizedMovements.filter((m) =>
        m.items.some((i) => String(i.productId) === String(p.id))
      );

      return {
        product: p,
        stockPhysical: p.stockPhysical || 0,
        stockCommitted: p.stockCommitted || 0,
        totalIngresos,
        totalSalidas,
        net,
        movementsCount: productMovements.length,
        history: prodKardex
      };
    });
  }, [products, kardex, normalizedMovements]);

  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    generateWarehousePDF({
      movements: filteredMovements,
      ordersData: filteredOrders,
      products,
      kardex,
      summary: summaryMetrics,
      filters: {
        type: typeFilter,
        datePreset,
        search: searchQuery
      }
    });
  };

  const handleDownloadExcel = () => {
    generateWarehouseExcel({
      movements: filteredMovements,
      ordersData: filteredOrders,
      products,
      kardex,
      summary: summaryMetrics,
      filters: {
        type: typeFilter,
        datePreset,
        search: searchQuery
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[130] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl overflow-hidden z-[140] flex flex-col h-[92vh] max-h-[880px] relative"
        >
          {/* Modal Header */}
          <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base md:text-lg tracking-tight text-white font-mono">
                    Reporte de Almacén: Control por Pedido, Ingresos y Salidas
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                    Auditoría ORD
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Trazabilidad directa por pedido (ORD): relación de ingreso de taller y salida de despacho, balance y kardex.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <button
                type="button"
                onClick={handleDownloadExcel}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-900/30 flex items-center gap-1.5 active:scale-95 font-mono"
                title="Descargar en Excel CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel (CSV)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-900/30 flex items-center gap-1.5 active:scale-95 font-mono"
                title="Descargar en PDF oficial"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick KPI Summary Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 px-5 py-2.5 bg-slate-50 border-b border-slate-200 shrink-0">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Total Ingresos</p>
                <p className="text-base font-black text-emerald-600 font-mono leading-tight">
                  +{summaryMetrics.totalIngresos} <span className="text-[10px] font-semibold text-slate-400">uds</span>
                </p>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Total Salidas</p>
                <p className="text-base font-black text-rose-600 font-mono leading-tight">
                  -{summaryMetrics.totalSalidas} <span className="text-[10px] font-semibold text-slate-400">uds</span>
                </p>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Saldo Neto</p>
                <p className={`text-base font-black font-mono leading-tight ${summaryMetrics.saldoNeto >= 0 ? "text-blue-600" : "text-amber-600"}`}>
                  {summaryMetrics.saldoNeto >= 0 ? "+" : ""}{summaryMetrics.saldoNeto} <span className="text-[10px] font-semibold text-slate-400">uds</span>
                </p>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Pedidos / ORD</p>
                <p className="text-base font-black text-purple-700 font-mono leading-tight">
                  {summaryMetrics.totalPedidos} <span className="text-[10px] font-semibold text-slate-400">órdenes</span>
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-white px-5 text-xs font-bold uppercase tracking-wider text-slate-500 overflow-x-auto shrink-0 min-h-[44px]">
            {[
              { id: "orders", label: "Trazabilidad por Pedido (ORD)", icon: ShoppingBag, count: filteredOrders.length },
              { id: "general", label: "Movimientos Generales", icon: Layers, count: filteredMovements.length },
              { id: "products", label: "Movimientos por Producto", icon: Package, count: products.length },
              { id: "kardex", label: "Historial Kardex Detallado", icon: FileText, count: kardex.length }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2.5 px-4 border-b-2 transition-all shrink-0 font-mono text-xs ${
                    active
                      ? "border-blue-600 text-blue-600 font-black bg-blue-50/40"
                      : "border-transparent hover:text-slate-900 hover:border-slate-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${active ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filters Toolbar */}
          <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter */}
              <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs font-mono">
                {["Todos", "Ingreso", "Salida"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all ${
                      typeFilter === t
                        ? t === "Ingreso"
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : t === "Salida"
                          ? "bg-rose-600 text-white shadow-2xs"
                          : "bg-slate-900 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {t === "Todos" ? "Todos" : t === "Ingreso" ? "+ Ingresos" : "- Salidas"}
                  </button>
                ))}
              </div>

              {/* Order Type Filter (A Pedido / Directo) */}
              <select
                value={orderTypeFilter}
                onChange={(e) => setOrderTypeFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 shadow-2xs outline-none font-mono"
              >
                <option value="Todos">Tipo: Todos</option>
                <option value="A Pedido">Tipo: A Pedido</option>
                <option value="Directo">Tipo: Directo</option>
              </select>

              {/* Date Preset */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer font-mono"
                >
                  <option value="Todo">Todo el periodo</option>
                  <option value="Hoy">Solo Hoy</option>
                  <option value="7dias">Últimos 7 días</option>
                  <option value="mes">Este Mes</option>
                  <option value="custom">Rango Personalizado...</option>
                </select>
              </div>

              {datePreset === "custom" && (
                <div className="flex items-center gap-1.5 animate-in fade-in">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold outline-none"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold outline-none"
                  />
                </div>
              )}

              {/* Product Filter */}
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs outline-none max-w-[180px] truncate"
              >
                <option value="Todos">Todos los Productos</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar ORD, OP, ID o prenda..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Tab Content Area */}
          <div className="p-5 overflow-y-auto flex-1 space-y-4">
            {/* TAB 1: TRAZABILIDAD POR PEDIDO (ORD) - DEFAULT */}
            {activeTab === "orders" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                  <span className="font-bold">
                    Mostrando <span className="text-slate-900 font-mono font-black">{filteredOrders.length}</span> órdenes de pedido con su respectivo Ingreso y Salida
                  </span>
                  <span className="text-[11px] italic font-serif">
                    Cada pedido refleja el ID de ingreso recibido de taller y el ID de salida despachado.
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider font-mono">
                      <tr>
                        <th className="py-3 px-3.5 w-24">Fecha</th>
                        <th className="py-3 px-4">ORD / Pedido (Tipo)</th>
                        <th className="py-3 px-4">ID Operación (Ingreso / Salida)</th>
                        <th className="py-3 px-4">Prendas y Modelos</th>
                        <th className="py-3 px-4 text-right">Cantidades (Flujo)</th>
                        <th className="py-3 px-3.5 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                            No se encontraron pedidos con los filtros seleccionados.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((ord, idx) => (
                          <tr key={ord.orderId || `ord-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                            {/* 1. FECHA AL INICIO */}
                            <td className="py-3 px-3.5 font-mono font-bold text-slate-500 text-[11px] align-top">
                              {ord.date || "-"}
                            </td>

                            {/* 2. ORD / PEDIDO CON SU TIPO (A PEDIDO O DIRECTO) */}
                            <td className="py-3 px-4 align-top">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono font-black text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                    {ord.orderId}
                                  </span>
                                  <span
                                    className={`px-2 py-0.2 rounded text-[10px] font-black uppercase font-mono border ${
                                      ord.orderType === "A Pedido"
                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                        : ord.orderType === "Directo"
                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : "bg-slate-100 text-slate-700 border-slate-200"
                                    }`}
                                  >
                                    {ord.orderType}
                                  </span>
                                </div>
                                {ord.opId && (
                                  <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                                    <span className="font-bold text-slate-400">OP Origen:</span>
                                    <span className="bg-blue-50 text-blue-700 px-1 rounded font-semibold">{ord.opId}</span>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* 3. ID OPERACIÓN: INGRESO Y SALIDA CORRESPONDIENTES */}
                            <td className="py-3 px-4 align-top">
                              <div className="space-y-1.5">
                                {/* Ingreso correspondiente */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
                                    <ArrowDownLeft className="w-2.5 h-2.5 text-emerald-600" /> Ingreso:
                                  </span>
                                  {ord.ingresos.length > 0 ? (
                                    ord.ingresos.map((ing, iIdx) => (
                                      <span
                                        key={iIdx}
                                        className="font-mono font-bold text-slate-800 text-xs bg-white px-1.5 py-0.2 rounded border border-slate-200"
                                      >
                                        {ing.id}{" "}
                                        <span className="text-emerald-600 font-black text-[11px]">(+{ing.quantity}u)</span>
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-slate-400 italic text-[10px] font-mono">Pendiente ingreso</span>
                                  )}
                                </div>

                                {/* Salida correspondiente */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase font-mono bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-0.5">
                                    <ArrowUpRight className="w-2.5 h-2.5 text-rose-600" /> Salida:
                                  </span>
                                  {ord.salidas.length > 0 ? (
                                    ord.salidas.map((sal, sIdx) => (
                                      <span
                                        key={sIdx}
                                        className="font-mono font-bold text-slate-800 text-xs bg-white px-1.5 py-0.2 rounded border border-slate-200"
                                      >
                                        {sal.id}{" "}
                                        <span className="text-rose-600 font-black text-[11px]">(-{sal.quantity}u)</span>
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-slate-400 italic text-[10px] font-mono">Sin salida (En almacén)</span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* 4. PRENDAS Y MODELOS */}
                            <td className="py-3 px-4 align-top text-slate-700">
                              {ord.items && ord.items.length > 0 ? (
                                <div className="space-y-0.5">
                                  {ord.items.map((it, itIdx) => (
                                    <div key={itIdx} className="flex items-center gap-1.5 text-xs">
                                      <span className="font-semibold text-slate-800">{it.productName || "Prenda"}</span>
                                      <span className="text-[10px] font-mono text-slate-400">({it.quantity}u)</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="italic text-slate-400 text-xs">Prendas según orden</span>
                              )}
                            </td>

                            {/* 5. CANTIDADES (FLUJO) */}
                            <td className="py-3 px-4 align-top text-right font-mono">
                              <div className="space-y-0.5">
                                <div className="text-xs">
                                  <span className="text-emerald-600 font-bold">+{ord.totalIngreso}u</span>
                                  <span className="text-slate-300 mx-1">/</span>
                                  <span className="text-rose-600 font-bold">-{ord.totalSalida}u</span>
                                </div>
                                <div className="text-[10px] font-bold text-slate-500">
                                  Saldo:{" "}
                                  <span
                                    className={
                                      ord.balance === 0
                                        ? "text-slate-600 font-black"
                                        : ord.balance > 0
                                        ? "text-blue-600 font-black"
                                        : "text-amber-600 font-black"
                                    }
                                  >
                                    {ord.balance >= 0 ? "+" : ""}{ord.balance} uds
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* 6. ESTADO */}
                            <td className="py-3 px-3.5 align-top text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase font-mono tracking-wider border ${
                                  ord.orderStatus.includes("Completado")
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : ord.orderStatus.includes("Almacén")
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : ord.orderStatus.includes("Parcial")
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                              >
                                {ord.orderStatus.includes("Completado") ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Clock className="w-3 h-3 text-blue-500" />
                                )}
                                {ord.orderStatus}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: GENERAL MOVEMENTS (Listado Cronológico) */}
            {activeTab === "general" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                  <span className="font-bold">
                    Mostrando <span className="text-slate-900 font-mono font-black">{filteredMovements.length}</span> operaciones individuales de almacén
                  </span>
                  <span className="text-[11px] italic font-serif">
                    Ordenado por fecha cronológica al inicio, indicando la orden y tipo de operación.
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider font-mono">
                      <tr>
                        <th className="py-3 px-3.5 w-24">Fecha</th>
                        <th className="py-3 px-4">ORD / Pedido (Tipo)</th>
                        <th className="py-3 px-4">ID Operación</th>
                        <th className="py-3 px-3.5">Tipo</th>
                        <th className="py-3 px-4">Referencia / OP</th>
                        <th className="py-3 px-4">Prendas y Modelos</th>
                        <th className="py-3 px-4 text-right">Cantidad</th>
                        <th className="py-3 px-3.5 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredMovements.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                            No se encontraron movimientos con los filtros seleccionados.
                          </td>
                        </tr>
                      ) : (
                        filteredMovements.map((m, idx) => {
                          const orderCode = m.orderId || (m.originType === "Autostock" ? "Autostock" : "Directo");
                          return (
                            <tr key={m.id || `m-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                              {/* 1. FECHA AL INICIO */}
                              <td className="py-3 px-3.5 font-mono font-bold text-slate-500 text-[11px] align-top">
                                {m.date}
                              </td>

                              {/* 2. ORD / PEDIDO (TIPO) */}
                              <td className="py-3 px-4 align-top">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono font-black text-slate-800 text-xs">
                                    {orderCode}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase font-mono border ${
                                      m.originType === "A Pedido"
                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                    }`}
                                  >
                                    {m.originType}
                                  </span>
                                </div>
                              </td>

                              {/* 3. ID OPERACIÓN */}
                              <td className="py-3 px-4 font-mono font-black text-slate-800 align-top">
                                {m.id}
                              </td>

                              {/* 4. TIPO */}
                              <td className="py-3 px-3.5 align-top">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border font-mono ${
                                    m.type === "Ingreso"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-rose-50 text-rose-700 border-rose-200"
                                  }`}
                                >
                                  {m.type === "Ingreso" ? (
                                    <>
                                      <ArrowDownLeft className="w-2.5 h-2.5 text-emerald-600" /> Ingreso
                                    </>
                                  ) : (
                                    <>
                                      <ArrowUpRight className="w-2.5 h-2.5 text-rose-600" /> Salida
                                    </>
                                  )}
                                </span>
                              </td>

                              {/* 5. REFERENCIA / OP */}
                              <td className="py-3 px-4 text-slate-700 align-top">
                                <div className="font-bold text-xs flex items-center gap-1.5">
                                  {m.opId && (
                                    <span className="bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200 font-mono text-[10px]">
                                      OP: {m.opId}
                                    </span>
                                  )}
                                  {!m.opId && (
                                    <span className="font-mono text-slate-500 text-[11px]">{m.reason}</span>
                                  )}
                                </div>
                              </td>

                              {/* 6. PRENDAS Y MODELOS */}
                              <td className="py-3 px-4 text-slate-600 align-top">
                                {m.items && m.items.length > 0 ? (
                                  <div className="space-y-0.5">
                                    {m.items.map((item, iIdx) => (
                                      <div key={iIdx} className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-800">{item.productName || "Prenda"}</span>
                                        <span className="text-[10px] font-mono text-slate-400">({item.quantity}u)</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="italic text-slate-400 text-[11px]">{m.reason || "Operación regular"}</span>
                                )}
                              </td>

                              {/* 7. CANTIDAD */}
                              <td
                                className={`py-3 px-4 text-right font-black font-mono text-sm align-top ${
                                  m.type === "Ingreso" ? "text-emerald-600" : "text-rose-600"
                                }`}
                              >
                                {m.type === "Ingreso" ? "+" : "-"}{m.totalQuantity}{" "}
                                <span className="text-[10px] font-bold text-slate-400">uds</span>
                              </td>

                              {/* 8. ESTADO */}
                              <td className="py-3 px-3.5 text-center align-top">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono ${
                                    m.status === "Aceptado"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {m.status === "Aceptado" ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                                  {m.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: PRODUCTS BREAKDOWN */}
            {activeTab === "products" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                  <span className="font-bold">
                    Control de existencias, entradas y salidas consolidado por cada producto
                  </span>
                  <span className="text-[11px] italic font-serif">
                    Haz clic en una fila para desplegar su historial detallado de movimientos.
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider font-mono">
                      <tr>
                        <th className="py-3 px-4">Producto / Modelo</th>
                        <th className="py-3 px-4">Categoría</th>
                        <th className="py-3 px-4 text-right">Stock Físico</th>
                        <th className="py-3 px-4 text-right">Total Ingresos</th>
                        <th className="py-3 px-4 text-right">Total Salidas</th>
                        <th className="py-3 px-4 text-right">Saldo Neto</th>
                        <th className="py-3 px-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {productSummaries.map((ps) => {
                        const isExpanded = expandedProductId === ps.product.id;
                        return (
                          <React.Fragment key={ps.product.id}>
                            <tr
                              onClick={() => setExpandedProductId(isExpanded ? null : ps.product.id)}
                              className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                    {ps.product.image ? (
                                      <img
                                        src={ps.product.image}
                                        alt={ps.product.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Package className="w-5 h-5 text-slate-400 m-auto mt-2.5" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900">{ps.product.name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">ID: {ps.product.id} • S/ {ps.product.price}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-600 font-medium">
                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {ps.product.category || "General"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-black font-mono text-sm text-slate-900">
                                {ps.stockPhysical} <span className="text-[10px] font-normal text-slate-400">uds</span>
                              </td>
                              <td className="py-3 px-4 text-right font-black font-mono text-sm text-emerald-600">
                                +{ps.totalIngresos} <span className="text-[10px] font-normal text-slate-400">uds</span>
                              </td>
                              <td className="py-3 px-4 text-right font-black font-mono text-sm text-rose-600">
                                -{ps.totalSalidas} <span className="text-[10px] font-normal text-slate-400">uds</span>
                              </td>
                              <td className="py-3 px-4 text-right font-black font-mono text-sm">
                                <span className={ps.net >= 0 ? "text-blue-600" : "text-amber-600"}>
                                  {ps.net >= 0 ? "+" : ""}{ps.net} uds
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase font-mono tracking-wider flex items-center gap-1 mx-auto"
                                >
                                  <span>{isExpanded ? "Ocultar" : "Ver Detalle"}</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </td>
                            </tr>

                            {/* Expanded Row */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={7} className="p-0 bg-slate-50/70 border-b border-slate-200">
                                  <div className="p-4 md:p-5 space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                                      <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-800 font-mono flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-blue-600" /> Historial de Movimientos de {ps.product.name}
                                      </h5>
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        {ps.history.length} registros en Kardex
                                      </span>
                                    </div>

                                    {ps.history.length === 0 ? (
                                      <p className="text-xs text-slate-400 italic py-3 text-center">
                                        No hay movimientos registrados para este producto todavía.
                                      </p>
                                    ) : (
                                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                                        <table className="w-full text-left text-xs">
                                          <thead className="bg-slate-100 text-slate-500 text-[9px] uppercase font-mono font-bold">
                                            <tr>
                                              <th className="py-2 px-3">Fecha</th>
                                              <th className="py-2 px-3">Operación</th>
                                              <th className="py-2 px-3">Concepto / Glosa</th>
                                              <th className="py-2 px-3">Referencia</th>
                                              <th className="py-2 px-3 text-right">Cantidad</th>
                                              <th className="py-2 px-3 text-right">Saldo Resultante</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100">
                                            {ps.history.map((h, hIdx) => (
                                              <tr key={h._id || h.id || `ph-${hIdx}`} className="hover:bg-slate-50">
                                                <td className="py-2 px-3 font-mono text-[10px] text-slate-500">{h.date}</td>
                                                <td className="py-2 px-3">
                                                  <span
                                                    className={`px-2 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                                                      h.type === "Ingreso"
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                        : "bg-rose-50 text-rose-700 border border-rose-200"
                                                    }`}
                                                  >
                                                    {h.type}
                                                  </span>
                                                </td>
                                                <td className="py-2 px-3 font-medium text-slate-700">{h.reason}</td>
                                                <td className="py-2 px-3 font-mono text-[10px] text-slate-500">{h.documentRef || "-"}</td>
                                                <td
                                                  className={`py-2 px-3 text-right font-mono font-bold ${
                                                    h.type === "Ingreso" ? "text-emerald-600" : "text-rose-600"
                                                  }`}
                                                >
                                                  {h.type === "Ingreso" ? "+" : "-"}{h.quantity} uds
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono font-black text-slate-900">
                                                  {h.balance} uds
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: KARDEX LOG */}
            {activeTab === "kardex" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                  <span className="font-bold">
                    Libro Diario de Movimientos de Kardex Valorizado y Físico
                  </span>
                  <span className="text-[11px] italic font-serif">
                    Registro inmutable con saldos acumulados de existencias.
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider font-mono">
                      <tr>
                        <th className="py-3 px-4">Fecha</th>
                        <th className="py-3 px-4">ID Prenda</th>
                        <th className="py-3 px-4">Tipo</th>
                        <th className="py-3 px-4">Glosa / Motivo</th>
                        <th className="py-3 px-4">Referencia</th>
                        <th className="py-3 px-4 text-right">Cantidad</th>
                        <th className="py-3 px-4 text-right">Saldo Final</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {kardex.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                            No hay registros de Kardex en el sistema.
                          </td>
                        </tr>
                      ) : (
                        kardex.slice(-50).reverse().map((entry, idx) => {
                          const prod = products.find((p) => String(p.id) === String(entry.productId));
                          return (
                            <tr key={entry._id || entry.id || `k-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-slate-500 text-[11px]">
                                {entry.date}
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-bold text-slate-800">{prod ? prod.name : `Producto ${entry.productId}`}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border font-mono ${
                                    entry.type === "Ingreso"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-rose-50 text-rose-700 border-rose-200"
                                  }`}
                                >
                                  {entry.type}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-700 font-medium">
                                {entry.reason || "Ajuste de inventario"}
                              </td>
                              <td className="py-3 px-4 font-mono text-[10px] text-slate-500">
                                {entry.documentRef || "-"}
                              </td>
                              <td
                                className={`py-3 px-4 text-right font-black font-mono text-sm ${
                                  entry.type === "Ingreso" ? "text-emerald-600" : "text-rose-600"
                                }`}
                              >
                                {entry.type === "Ingreso" ? "+" : "-"}{entry.quantity} uds
                              </td>
                              <td className="py-3 px-4 text-right font-black font-mono text-sm text-slate-900">
                                {entry.balance} uds
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Reporte sincronizado con MongoDB Atlas • Control de Órdenes ORD & Kardex</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 uppercase font-mono tracking-wider text-[11px]"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" /> Imprimir
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-sm uppercase font-mono tracking-wider text-[11px]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

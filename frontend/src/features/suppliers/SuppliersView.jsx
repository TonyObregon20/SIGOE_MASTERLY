import React, { useEffect, useState, useMemo } from "react";
import { X, Building2, Plus, Search, Filter, Scissors, Layers, Sparkles, Flame, Package, Tags, CheckCircle2, Edit3, Trash2, Phone, Mail, MapPin, ClipboardList } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  SUPPLIER_SPECIALTIES,
  SPECIALTY_COLORS
} from "./suppliersUtils";
import SupplierFormModal from "./components/SupplierFormModal";
import SupplierHistoryModal from "./components/SupplierHistoryModal";
import DeleteSupplierModal from "./components/DeleteSupplierModal";
import { Pagination } from "@/components/shop/ShopUI";

const SPECIALTY_ICONS = {
  Corte: Scissors,
  Costura: Layers,
  Limpieza: Sparkles,
  Planchado: Flame,
  Empaquetado: Package,
  Insumos: Tags
};

export default function SuppliersView({
  suppliers = [],
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onAddSupplierRecord,
  onDeleteSupplierRecord,
  loadSuppliers
}) {
  // Filter States
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'servicios' | 'insumos'
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [supplierForHistory, setSupplierForHistory] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);

  // Success message toast
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // KPIs
  const stats = useMemo(() => {
    const total = suppliers.length;
    const services = suppliers.filter(
      (s) => s.specialty !== "Insumos" && s.type !== "Insumos"
    );
    const insumos = suppliers.filter(
      (s) => s.specialty === "Insumos" || s.type === "Insumos"
    );

    const totalServicesCount = services.reduce(
      (acc, s) => acc + (Number(s.servicesCount) || (s.history ? s.history.length : 0)),
      0
    );
    const totalPrendasProcessed = services.reduce(
      (acc, s) => acc + (Number(s.totalUnitsProcessed) || 0),
      0
    );

    const totalPurchasesCount = insumos.reduce(
      (acc, s) => acc + (Number(s.purchasesCount) || (s.history ? s.history.length : 0)),
      0
    );
    const totalInsumosUnits = insumos.reduce(
      (acc, s) => acc + (Number(s.totalUnitsPurchased) || 0),
      0
    );

    return {
      total,
      servicesCount: services.length,
      insumosCount: insumos.length,
      totalServicesCount,
      totalPrendasProcessed,
      totalPurchasesCount,
      totalInsumosUnits
    };
  }, [suppliers]);

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const isService = s.specialty !== "Insumos" && s.type !== "Insumos";

      // Tab filter
      if (activeTab === "servicios" && !isService) return false;
      if (activeTab === "insumos" && isService) return false;

      // Specialty subfilter
      if (selectedSpecialty !== "all" && s.specialty !== selectedSpecialty) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          s.name?.toLowerCase().includes(q) ||
          s.contact?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.phone?.toLowerCase().includes(q) ||
          s.documentNumber?.toLowerCase().includes(q) ||
          s.insumoDetails?.toLowerCase().includes(q) ||
          s.specialty?.toLowerCase().includes(q) ||
          s.address?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [suppliers, activeTab, selectedSpecialty, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedSpecialty, searchQuery]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / pageSize));
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [filteredSuppliers.length, pageSize, currentPage]);

  const pagedSuppliers = filteredSuppliers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Keep history modal in sync when suppliers update
  const currentHistorySupplier = useMemo(() => {
    if (!supplierForHistory) return null;
    return suppliers.find(
      (s) => (s.id && s.id === supplierForHistory.id) || (s._id && s._id === supplierForHistory._id)
    ) || supplierForHistory;
  }, [suppliers, supplierForHistory]);

  // CRUD Handlers
  const handleOpenCreate = () => {
    setSupplierToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (supplier) => {
    setSupplierToEdit(supplier);
    setIsFormModalOpen(true);
  };

  const handleOpenHistory = (supplier) => {
    setSupplierForHistory(supplier);
    setIsHistoryModalOpen(true);
  };

  const handleOpenDelete = (supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteModalOpen(true);
  };

  const handleSaveSupplier = async (data) => {
    if (supplierToEdit) {
      await onUpdateSupplier(supplierToEdit.id || supplierToEdit._id, data);
      showToast(`Proveedor "${data.name}" actualizado exitosamente.`);
    } else {
      await onAddSupplier(data);
      showToast(`Proveedor "${data.name}" registrado exitosamente.`);
    }
  };

  const handleDeleteConfirm = async (id) => {
    await onDeleteSupplier(id);
    showToast("Proveedor eliminado correctamente.");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[150] bg-shop-ink text-white px-5 py-3 rounded-[2px] border border-slate-700 flex items-center gap-3 text-xs font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-col sm:items-start justify-between gap-4 border-b border-shop-line pb-4 xl:flex-row xl:items-center">
        <div className="space-y-1">
          <h1 className="text-shop-ink tracking-tight flex items-center gap-2 font-medium text-[28px]">
            <Building2 className="w-6 h-6 text-shop-blue" /> Gestión de Proveedores
          </h1>
          <p className="text-xs font-medium text-shop-muted font-shop">
            Control de tercerización por etapas (corte, costura, limpieza, planchado, empaque) y compras de insumos
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-shop-ink hover:bg-shop-ink text-white rounded-[2px] text-xs font-medium transition-all tabular-nums min-h-9"
        >
          <Plus className="w-4 h-4" /> Nuevo Proveedor
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Proveedores */}
        <div className="p-5 rounded-[2px] bg-white border border-shop-line relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-shop-muted">
              Total Proveedores
            </span>
            <div className="w-8 h-8 rounded-[2px] bg-shop-light flex items-center justify-center text-shop-muted">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-shop-ink tabular-nums">
            {stats.total}
          </div>
          <div className="text-[11px] text-shop-muted mt-1 flex items-center gap-2">
            <span className="text-shop-blue font-medium">{stats.servicesCount} Servicios</span> •{" "}
            <span className="text-emerald-600 font-medium">{stats.insumosCount} Insumos</span>
          </div>
        </div>

        {/* Talleres de Servicio (Costura, Corte, etc.) */}
        <div className="p-5 rounded-[2px] bg-white border border-shop-light relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-shop-blue">
              Talleres de Servicio
            </span>
            <div className="w-8 h-8 rounded-[2px] bg-shop-light text-shop-blue flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-blue-950 tabular-nums">
            {stats.servicesCount}
          </div>
          <div className="text-[11px] text-shop-blue mt-1">
            Corte, costura, limpieza, planchado y empaque
          </div>
        </div>

        {/* Servicios Brindados (Pedidos / OPs) */}
        <div className="p-5 rounded-[2px] bg-white border border-shop-line relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-shop-muted">
              Servicios Brindados
            </span>
            <div className="w-8 h-8 rounded-[2px] bg-amber-50 text-amber-600 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-shop-ink tabular-nums">
            {stats.totalServicesCount}{" "}
            <span className="text-xs font-normal text-shop-muted">veces / pedidos</span>
          </div>
          <div className="text-[11px] text-shop-muted mt-1">
            {stats.totalPrendasProcessed.toLocaleString("es-PE")} prendas procesadas en total
          </div>
        </div>

        {/* Compras de Insumos Registradas */}
        <div className="p-5 rounded-[2px] bg-white border border-emerald-100 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-emerald-700">
              Compras de Insumos
            </span>
            <div className="w-8 h-8 rounded-[2px] bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Tags className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-emerald-950 tabular-nums">
            {stats.totalPurchasesCount}{" "}
            <span className="text-xs font-normal text-emerald-700">compras</span>
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">
            {stats.totalInsumosUnits.toLocaleString("es-PE")} unidades (collarines, agujas, etc.)
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white border border-shop-line rounded-[2px] p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Main Tabs */}
          <div className="flex w-full flex-wrap items-center gap-1.5 rounded-[2px] bg-shop-light p-1 sm:w-fit">
            <button
              type="button"
              onClick={() => {
                setActiveTab("all");
                setSelectedSpecialty("all");
              }}
              className={`px-4 py-2 rounded-[2px] text-xs font-medium transition-all ${
                activeTab === "all"
                  ? "bg-white text-shop-ink font-medium"
                  : "text-shop-muted hover:text-shop-ink"
              }`}
            >
              Todos ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("servicios");
                setSelectedSpecialty("all");
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-[2px] text-xs font-medium transition-all ${
                activeTab === "servicios"
                  ? "bg-shop-ink text-white font-medium"
                  : "text-shop-muted hover:text-shop-blue"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Servicios de Taller ({stats.servicesCount})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("insumos");
                setSelectedSpecialty("Insumos");
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-[2px] text-xs font-medium transition-all ${
                activeTab === "insumos"
                  ? "bg-shop-ink text-white font-medium"
                  : "text-shop-muted hover:text-emerald-600"
              }`}
            >
              <Tags className="w-3.5 h-3.5" />
              <span>Insumos ({stats.insumosCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-shop-muted absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, RUC/DNI, contacto, insumo o teléfono..."
              className="w-full pl-9 pr-4 py-2.5 bg-shop-light border border-shop-line rounded-[2px] outline-none focus:ring-2 focus:ring-shop-blue/20 focus:border-shop-line transition-all min-h-10 min-w-0 text-base sm:text-[13px]"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-xs text-shop-muted hover:text-shop-muted font-medium"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Sub-chips for Service Specialties */}
        {activeTab !== "insumos" && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-shop-line text-xs">
            <span className="text-[11px] font-medium text-shop-muted mr-2 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filtrar Especialidad:
            </span>
            <button
              type="button"
              onClick={() => setSelectedSpecialty("all")}
              className={`px-3 py-1 rounded-[2px] text-xs font-medium transition-all border ${
                selectedSpecialty === "all"
                  ? "bg-shop-ink text-white border-slate-900"
                  : "bg-white text-shop-muted border-shop-line hover:bg-shop-light"
              }`}
            >
              Todas
            </button>
            {SUPPLIER_SPECIALTIES.map((spec) => {
              const Icon = SPECIALTY_ICONS[spec] || Tags;
              const isSelected = selectedSpecialty === spec;
              return (
                <button
                  key={spec}
                  type="button"
                  onClick={() => setSelectedSpecialty(spec)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] text-xs font-medium transition-all border ${
                    isSelected
                      ? "bg-shop-light border-blue-300 text-shop-blue"
                      : "bg-white text-shop-muted border-shop-line hover:bg-shop-light"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{spec}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Suppliers Table */}
      <div className="bg-white border border-shop-line rounded-[2px] overflow-hidden">
        {filteredSuppliers.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-medium text-shop-muted">No se encontraron proveedores</p>
            <p className="text-xs text-shop-muted max-w-sm mx-auto mt-1">
              Prueba cambiando los filtros de búsqueda o registra un nuevo proveedor con el botón superior.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-w-full">
            <table className="w-full text-left text-xs min-w-[680px] text-[13px]">
              <thead className="bg-shop-light border-b border-shop-line tabular-nums">
                <tr>
                  <th className="px-5 py-4 text-xs font-medium text-shop-muted whitespace-nowrap">
                    Proveedor
                  </th>
                  <th className="px-5 py-4 text-xs font-medium text-shop-muted whitespace-nowrap">
                    Característica / Servicio
                  </th>
                  <th className="px-5 py-4 text-xs font-medium text-shop-muted whitespace-nowrap">
                    Contacto & Teléfono
                  </th>
                  <th className="px-5 py-4 text-xs font-medium text-shop-muted whitespace-nowrap">
                    Insumos / Tarifa
                  </th>
                  <th className="px-5 py-4 text-xs font-medium text-shop-muted whitespace-nowrap">
                    Control & Historial
                  </th>
                  <th className="px-5 py-4 text-xs font-medium text-shop-muted whitespace-nowrap">
                    Estado
                  </th>
                  <th className="px-5 py-4 text-xs font-medium text-shop-muted text-right whitespace-nowrap">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-shop-line">
                {pagedSuppliers.map((supplier) => {
                  const isService =
                    supplier.specialty !== "Insumos" && supplier.type !== "Insumos";
                  const Icon = SPECIALTY_ICONS[supplier.specialty] || Tags;
                  const colorConfig =
                    SPECIALTY_COLORS[supplier.specialty] || SPECIALTY_COLORS["Costura"];

                  return (
                    <tr
                      key={supplier.id || supplier._id}
                      className="hover:bg-shop-light/70 transition-colors group"
                    >
                      {/* 1. Proveedor */}
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-[2px] flex items-center justify-center shrink-0 border ${colorConfig.border}  ${colorConfig.bg}  ${colorConfig.text}`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium text-shop-ink text-sm tracking-tight flex items-center gap-1.5">
                              <span>{supplier.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-shop-muted tabular-nums mt-0.5">
                              {supplier.documentNumber && (
                                <span>
                                  {supplier.documentType || "RUC"}: {supplier.documentNumber}
                                </span>
                              )}
                              <span>• ID: {supplier.id}</span>
                            </div>
                            {supplier.address && (
                              <div className="text-[11px] text-shop-muted flex items-center gap-1 mt-0.5 line-clamp-1">
                                <MapPin className="w-2.5 h-2.5 shrink-0" />
                                <span>{supplier.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Característica / Servicio */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-xs font-medium border ${colorConfig.bg}  ${colorConfig.text}  ${colorConfig.border}`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{supplier.specialty}</span>
                          </span>
                          <div>
                            <span
                              className={`text-[11px] font-medium px-1.5 py-0.5 rounded-[2px] ${
                                isService
                                  ? "bg-shop-light/70 text-shop-blue"
                                  : "bg-emerald-100/70 text-emerald-800"
                              }`}
                            >
                              {isService ? "Servicio Tercerizado" : "Material / Insumo"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Contacto & Teléfono */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          {supplier.contact && (
                            <div className="font-medium text-shop-ink flex items-center gap-1.5">
                              <span>{supplier.contact}</span>
                            </div>
                          )}
                          {supplier.phone && (
                            <div className="text-[11px] text-shop-muted tabular-nums flex items-center gap-1">
                              <Phone className="w-3 h-3 text-shop-muted" />
                              <span>{supplier.phone}</span>
                            </div>
                          )}
                          {supplier.email && (
                            <div className="text-[11px] text-shop-muted flex items-center gap-1">
                              <Mail className="w-3 h-3 text-shop-muted" />
                              <span>{supplier.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 4. Insumos o Tarifa referencial */}
                      <td className="px-5 py-4">
                        {isService ? (
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-medium text-shop-muted block">
                              Tarifa Estimada
                            </span>
                            <div className="tabular-nums font-medium text-shop-ink text-xs">
                              {supplier.unitCostRate > 0
                                ? `S/ ${Number(supplier.unitCostRate).toFixed(2)} / prenda`
                                : "A cotizar"}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5 max-w-xs">
                            <span className="text-[11px] font-medium text-emerald-700 block">
                              Insumos suministrados
                            </span>
                            <p className="text-shop-muted text-[11px] line-clamp-2">
                              {supplier.insumoDetails || "Collarines, agujas, botones..."}
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 5. Control & Historial (Métricas diferenciadas) */}
                      <td className="px-5 py-4">
                        {isService ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="tabular-nums font-medium text-blue-900 text-xs bg-shop-light px-2 py-0.5 rounded-[2px] border border-shop-line">
                                {supplier.servicesCount || 0} servicios
                              </span>
                              <span className="text-[11px] text-shop-muted">atendidos</span>
                            </div>
                            <div className="text-[11px] text-shop-muted tabular-nums">
                              {(supplier.totalUnitsProcessed || 0).toLocaleString("es-PE")} prendas
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="tabular-nums font-medium text-emerald-900 text-xs bg-emerald-50 px-2 py-0.5 rounded-[2px] border border-emerald-200">
                                {supplier.purchasesCount || 0} compras
                              </span>
                              <span className="text-[11px] text-shop-muted">registradas</span>
                            </div>
                            <div className="text-[11px] text-shop-muted tabular-nums">
                              {(supplier.totalUnitsPurchased || 0).toLocaleString("es-PE")} insumos
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 6. Estado */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            supplier.status === "Inactivo"
                              ? "bg-shop-light text-shop-muted border border-shop-line"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              supplier.status === "Inactivo" ? "bg-slate-400" : "bg-emerald-500"
                            }`}
                          />
                          <span>{supplier.status || "Activo"}</span>
                        </span>
                      </td>

                      {/* 7. Acciones */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ver Historial & Control */}
                          <button
                            type="button"
                            onClick={() => handleOpenHistory(supplier)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-[2px] bg-shop-light text-shop-blue hover:bg-shop-light text-[11px] font-medium transition-all border border-shop-line"
                            title="Ver historial y control"
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                            <span>Historial</span>
                          </button>

                          {/* Editar */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(supplier)}
                            className="p-1.5 rounded-[2px] text-shop-muted hover:text-shop-ink hover:bg-shop-light transition-colors"
                            title="Editar proveedor"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Eliminar */}
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(supplier)}
                            className="p-1.5 rounded-[2px] text-shop-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Eliminar proveedor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {filteredSuppliers.length > 0 && (
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredSuppliers.length}
          itemLabel="proveedores"
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}

      {/* Modal: Crear / Editar Proveedor */}
      <SupplierFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveSupplier}
        supplierToEdit={supplierToEdit}
      />

      {/* Modal: Historial & Control de Servicios / Compras */}
      <SupplierHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setSupplierForHistory(null);
        }}
        supplier={currentHistorySupplier}
        onAddRecord={onAddSupplierRecord}
        onDeleteRecord={onDeleteSupplierRecord}
      />

      {/* Modal: Confirmación de Eliminación */}
      <DeleteSupplierModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSupplierToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        supplier={supplierToDelete}
      />
    </div>
  );
}

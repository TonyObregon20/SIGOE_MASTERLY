import React, { useState } from "react";
import {
  ShoppingBag,
  Package,
  Plus,
  AlertCircle,
  Globe,
  Banknote,
  TrendingUp
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import StatCard from "@/components/ui/StatCard";
import { useEcommerceMetrics } from "./hooks/useEcommerceMetrics";
import { useEcommerceFilters } from "./hooks/useEcommerceFilters";
import EcommerceFilterBar from "./components/EcommerceFilterBar";
import EcommerceProductRow from "./components/EcommerceProductRow";
import EcommerceSalesSummary from "./components/EcommerceSalesSummary";
import AddProductModal from "./components/AddProductModal";
import EditProductModal from "./components/EditProductModal";
import ImageGalleryModal from "./components/ImageGalleryModal";

/**
 * Ecommerce / Products Management Module View
 * Handles apparel catalog, pricing, web visibility, and direct store settings
 */
function EcommerceView({ products = [], orders = [], onUpdateProduct, onAddProduct }) {
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [selectedProductToEdit, setSelectedProductToEdit] = useState(null);
  const [galleryTarget, setGalleryTarget] = useState(null); // 'new' or 'edit'

  // Metric and filter hooks
  const {
    totalProductsCount,
    publicProductsCount,
    avgPrice,
    webTotalSales,
    webOrdersCount
  } = useEcommerceMetrics({ products, orders });

  const {
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    filterVisibility,
    setFilterVisibility,
    filteredProducts
  } = useEcommerceFilters({ products });

  const handleOpenEditModal = (p) => {
    setSelectedProductToEdit(p);
    setShowEditModal(true);
  };

  const handleSelectGalleryPreset = (url) => {
    if (galleryTarget === "edit" && selectedProductToEdit) {
      setSelectedProductToEdit((prev) => ({ ...prev, image: url }));
    }
    setShowGalleryModal(false);
    setGalleryTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-blue-600" /> Gestión de Productos
          </h2>
          <p className="text-xs font-medium text-slate-500 italic font-serif">
            Administra el catálogo de prendas, precios y visibilidad en tienda
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" /> Agregar Producto
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Catálogo"
          value={totalProductsCount.toString()}
          icon={Package}
          trend="Prendas Activas"
          color="blue"
        />
        <StatCard
          label="Visibles en Web"
          value={publicProductsCount.toString()}
          icon={Globe}
          trend={`${(((publicProductsCount / (totalProductsCount || 1)) * 100) || 0).toFixed(0)}% Publicado`}
          color="emerald"
        />
        <StatCard
          label="Precio Promedio"
          value={`S/ ${avgPrice.toFixed(2)}`}
          icon={Banknote}
          trend="Precio Sugerido"
          color="teal"
        />
        <StatCard
          label="Ventas Portal Web"
          value={`S/ ${webTotalSales.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`}
          icon={TrendingUp}
          trend={`${webOrdersCount} Pedidos`}
          color="indigo"
        />
      </div>

      {/* Search and Filters Toolbar */}
      <EcommerceFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        filterVisibility={filterVisibility}
        setFilterVisibility={setFilterVisibility}
      />

      {/* Products Catalog List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-xs">
            <AlertCircle className="w-10 h-10 text-slate-300" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">
              No se encontraron productos
            </h3>
            <p className="text-xs text-slate-400 max-w-sm italic">
              Prueba a cambiar tus filtros de búsqueda o categoría de productos.
            </p>
          </div>
        ) : (
          filteredProducts.map((p) => (
            <EcommerceProductRow
              key={p.id}
              product={p}
              onUpdateProduct={onUpdateProduct}
              onOpenEditModal={handleOpenEditModal}
            />
          ))
        )}
      </div>

      {/* Bottom Live Analytics and Advice */}
      <EcommerceSalesSummary
        webTotalSales={webTotalSales}
        webOrdersCount={webOrdersCount}
      />

      {/* --- MODAL: AGREGAR PRODUCTO --- */}
      <AnimatePresence>
        {showAddModal && (
          <AddProductModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onAddProduct={onAddProduct}
            onOpenGallery={() => {
              setGalleryTarget("new");
              setShowGalleryModal(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* --- MODAL: EDITAR PRODUCTO --- */}
      <AnimatePresence>
        {showEditModal && selectedProductToEdit && (
          <EditProductModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedProductToEdit(null);
            }}
            product={selectedProductToEdit}
            onUpdateProduct={onUpdateProduct}
            onOpenGallery={() => {
              setGalleryTarget("edit");
              setShowGalleryModal(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* --- MODAL: GALERÍA DE PRESETS & SUBIDA --- */}
      <AnimatePresence>
        {showGalleryModal && (
          <ImageGalleryModal
            isOpen={showGalleryModal}
            onClose={() => {
              setShowGalleryModal(false);
              setGalleryTarget(null);
            }}
            onSelectImage={handleSelectGalleryPreset}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default EcommerceView;

import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { cancelInvoiceApi } from "@/features/invoices/invoicesApi";

import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboardView from "@/features/dashboard/AdminDashboardView";
import InventoryView from "@/features/inventory/InventoryView";
import InvoicesView from "@/features/invoices/InvoicesView";
import ProductionView from "@/features/production/ProductionView";
import SuppliersView from "@/features/suppliers/SuppliersView";
import SalesManagementView from "@/features/orders/SalesManagementView";
import UsersManagementView from "@/features/users/UsersManagementView";
import EcommerceView from "@/features/products/EcommerceView";

function AdminPage({
  products,
  setProducts,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  productionOrders,
  setProductionOrders,
  createProductionOrder,
  updateStage,
  users,
  setUsers,
  orders,
  setOrders,
  handleShipOrder,
  kardex,
  onAddStock,
  warehouseMovements = [],
  onAcceptWarehouseMovement,
  onCreateSalida,
  onCreateIngreso,
  invoices,
  setInvoices,
  suppliers,
  setSuppliers,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onAddSupplierRecord,
  onDeleteSupplierRecord,
  loadSuppliers,
  loadOrders,
  loadProductionOrders,
  loadWarehouseMovements,
  currentUser: propCurrentUser,
  onUpdateUser,
  setIsLoggedIn,
  setCurrentUser,
  setView
}) {
  const { currentUser: authCurrentUser, logout } = useAuth();
  const currentUser = propCurrentUser || authCurrentUser;
  const [adminTab, setAdminTab] = useState("dashboard");

  return (
    <>
      {currentUser && currentUser.role === "admin" ? (
        <AdminLayout
          currentUser={currentUser}
          activeTab={adminTab}
          onNavigate={setAdminTab}
          onRefresh={() => {
            if (loadOrders) loadOrders();
            if (loadProductionOrders) loadProductionOrders();
            if (loadWarehouseMovements) loadWarehouseMovements();
          }}
          onLogout={() => {
            logout();
            if (setIsLoggedIn) setIsLoggedIn(false);
            if (setCurrentUser) setCurrentUser(null);
            setView("store");
          }}
          onStore={() => setView("store")}
        >
          {/* Admin Content */}
          <section className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={adminTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {adminTab === "dashboard" && (
                  <AdminDashboardView 
                    products={products} 
                    productionOrders={productionOrders} 
                    users={users} 
                    orders={orders} 
                    createProductionOrder={createProductionOrder}
                  />
                )}
                
                {adminTab === "inventory" && (
                  <InventoryView
                    products={products}
                    kardex={kardex}
                    warehouseMovements={warehouseMovements}
                    onAcceptWarehouseMovement={onAcceptWarehouseMovement}
                    onCreateSalida={onCreateSalida}
                    onCreateIngreso={onCreateIngreso}
                    orders={orders}
                    productionOrders={productionOrders}
                    onNewProduction={createProductionOrder}
                    onAddStock={onAddStock}
                  />
                )}
                
                {adminTab === "invoices" && (
                  <InvoicesView
                    invoices={invoices}
                    products={products}
                    onCancelInvoice={async (id) => {
                      try {
                        const data = await cancelInvoiceApi(id);
                        if (data.success) {
                          setInvoices((prev) => 
                            prev.map((inv) => inv.id === id ? { ...inv, status: "Anulado" } : inv)
                          );
                        } else {
                          alert("Error al anular comprobante: " + data.message);
                        }
                      } catch (error) {
                        console.error("Error cancelling invoice:", error);
                        setInvoices((prev) => 
                          prev.map((inv) => inv.id === id ? { ...inv, status: "Anulado" } : inv)
                        );
                      }
                    }}
                  />
                )}
                
                {adminTab === "production" && (
                  <ProductionView
                    productionOrders={productionOrders}
                    products={products}
                    salesOrders={orders}
                    warehouseMovements={warehouseMovements}
                    onOpenGenerateIngreso={() => setAdminTab("inventory")}
                    updateStage={updateStage}
                    setProductionOrders={setProductionOrders}
                    createProductionOrder={createProductionOrder}
                    suppliers={suppliers}
                    loadSuppliers={loadSuppliers}
                    onAddSupplierRecord={onAddSupplierRecord}
                  />
                )}
                
                {adminTab === "suppliers" && (
                  <SuppliersView
                    suppliers={suppliers}
                    onAddSupplier={onAddSupplier}
                    onUpdateSupplier={onUpdateSupplier}
                    onDeleteSupplier={onDeleteSupplier}
                    onAddSupplierRecord={onAddSupplierRecord}
                    onDeleteSupplierRecord={onDeleteSupplierRecord}
                    loadSuppliers={loadSuppliers}
                  />
                )}
                
                {adminTab === "sales" && (
                  <SalesManagementView
                    orders={orders}
                    products={products}
                    warehouseMovements={warehouseMovements}
                    productionOrders={productionOrders}
                    onNavigateToWarehouse={() => setAdminTab("inventory")}
                    onNavigateToProduction={() => setAdminTab("production")}
                    onShipOrder={handleShipOrder}
                    onUpdateOrder={(id, updates) => {
                      setOrders((prev) => 
                        prev.map((o) => o.id === id ? { ...o, ...updates } : o)
                      );
                    }}
                  />
                )}
                
                {adminTab === "users" && (
                 <UsersManagementView
                   users={users}
                   onUpdateUser={onUpdateUser}
                    onAddUser={(user) => setUsers((prev) => [...prev, user])}
                  />
                )}
                
                {adminTab === "ecommerce" && (
                  <EcommerceView
                    products={products}
                    orders={orders}
                    onUpdateProduct={onUpdateProduct ? onUpdateProduct : (id, updates) => {
                      if (setProducts) {
                        setProducts((prev) => 
                          prev.map((p) => p.id === id ? { ...p, ...updates } : p)
                        );
                      }
                    }}
                    onAddProduct={onAddProduct ? onAddProduct : (newProd) => {
                      if (setProducts) {
                        setProducts((prev) => [...prev, newProd]);
                      }
                    }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </section>
        </AdminLayout>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
          <h2 className="text-2xl font-medium tracking-tight">Sin Autorización</h2>
          <p className="text-shop-muted mb-8">No tienes permisos para acceder al área administrativa.</p>
          <button 
            onClick={() => {
              setView("store");
            }} 
            className="px-8 py-3 bg-shop-ink text-white font-medium border border-shop-ink"
          >
            Volver a la Tienda
          </button>
        </div>
      )}
    </>
  );
}

export default AdminPage;

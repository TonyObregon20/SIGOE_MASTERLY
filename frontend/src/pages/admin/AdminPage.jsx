import React, { useState } from "react";
import {
  ShoppingBag,
  Package,
  Truck,
  Users as UsersIcon,
  AlertCircle,
  ClipboardList,
  LayoutDashboard,
  Banknote,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { cancelInvoiceApi } from "@/features/invoices/invoicesApi";

import SidebarItem from "@/components/layout/SidebarItem";
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
  setIsLoggedIn,
  setCurrentUser,
  setView
}) {
  const { currentUser: authCurrentUser, logout } = useAuth();
  const currentUser = propCurrentUser || authCurrentUser;
  const [adminTab, setAdminTab] = useState("dashboard");

  return (
    <div className="space-y-6">
      {currentUser && currentUser.role === "admin" ? (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl lg:sticky lg:top-24 h-fit">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="font-serif italic font-black text-xs text-blue-500 uppercase tracking-widest">
                    Masterly ERP
                  </span>
                  <span className="text-[8px] font-bold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Admin
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (loadOrders) loadOrders();
                    if (loadProductionOrders) loadProductionOrders();
                    if (loadWarehouseMovements) loadWarehouseMovements();
                  }}
                  title="Sincronizar datos"
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <SidebarItem
                active={adminTab === "dashboard"}
                onClick={() => setAdminTab("dashboard")}
                icon={LayoutDashboard}
                label="Dashboard"
              />
              
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 py-2 mt-4">Comercio</div>
              <SidebarItem
                active={adminTab === "sales"}
                onClick={() => setAdminTab("sales")}
                icon={Banknote}
                label="Gestionar Ventas"
              />
              <SidebarItem
                active={adminTab === "ecommerce"}
                onClick={() => setAdminTab("ecommerce")}
                icon={ShoppingBag}
                label="Gestionar Productos"
              />
              
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 py-2 mt-4">Logística</div>
              <SidebarItem
                active={adminTab === "inventory"}
                onClick={() => setAdminTab("inventory")}
                icon={Package}
                label="Almacén & Kardex"
              />
              <SidebarItem
                active={adminTab === "invoices"}
                onClick={() => setAdminTab("invoices")}
                icon={ClipboardList}
                label="Comprobantes"
              />
              <SidebarItem
                active={adminTab === "production"}
                onClick={() => setAdminTab("production")}
                icon={ClipboardList}
                label="Producción (OP)"
              />
              
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 py-2 mt-4">Cuentas</div>
              <SidebarItem
                active={adminTab === "users"}
                onClick={() => setAdminTab("users")}
                icon={UsersIcon}
                label="Gestionar Usuarios"
              />
              <SidebarItem
                active={adminTab === "suppliers"}
                onClick={() => setAdminTab("suppliers")}
                icon={Truck}
                label="Proveedores"
              />
              
              <div className="mt-8 p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden">
                    <img
                      src={`https://ui-avatars.com/api/?name=${currentUser?.name}&background=0f172a&color=fff`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      alt=""
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{currentUser?.name}</p>
                    <button 
                      onClick={() => {
                        logout();
                        if (setIsLoggedIn) setIsLoggedIn(false);
                        if (setCurrentUser) setCurrentUser(null);
                        setView("store");
                      }} 
                      className="text-[10px] text-slate-500 underline cursor-pointer hover:text-red-400"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>

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
                    onUpdateUser={(id, updates) => {
                      setUsers((prev) => 
                        prev.map((u) => u.id === id ? { ...u, ...updates } : u)
                      );
                    }}
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
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
          <h2 className="text-2xl font-serif italic font-bold">Sin Autorización</h2>
          <p className="text-slate-500 mb-8">No tienes permisos para acceder al área administrativa.</p>
          <button 
            onClick={() => {
              setView("store");
            }} 
            className="px-8 py-3 bg-slate-900 text-white font-bold rounded-lg shadow-xl"
          >
            Volver a la Tienda
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminPage;

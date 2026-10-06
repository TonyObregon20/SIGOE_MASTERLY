import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

// Components & Page Modules
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/features/auth/components/AuthModal";
import CartDrawer from "@/features/cart/components/CartDrawer";
import PaymentModal from "@/features/cart/components/PaymentModal";
import OrderSuccessModal from "@/features/orders/components/OrderSuccessModal";
import MyOrdersModal from "@/features/orders/components/MyOrdersModal";

import StorePage from "@/pages/StorePage";
import ProductsPage from "@/pages/ProductsPage";
import OnDemandPage from "@/pages/OnDemandPage";
import CollectionsPage from "@/pages/CollectionsPage";
import AboutUsPage from "@/pages/AboutUsPage";
import AdminPage from "@/pages/admin/AdminPage";

// Application UI Hooks
import { useAppModals } from "./hooks/useAppModals";

// Domain Feature Hooks
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCart } from "@/features/cart/hooks/useCart";
import { useProducts } from "@/features/products/hooks/useProducts";
import { useOrders } from "@/features/orders/hooks/useOrders";
import { useProduction } from "@/features/production/hooks/useProduction";
import { useInventory } from "@/features/inventory/hooks/useInventory";
import { useSuppliers } from "@/features/suppliers/hooks/useSuppliers";
import { useWarehouse } from "@/features/warehouse/hooks/useWarehouse";
import { useUsers } from "@/features/users/hooks/useUsers";
import { useInvoices } from "@/features/invoices/hooks/useInvoices";
import { useCheckout } from "@/features/checkout/hooks/useCheckout";
import { INVOICE_SERIES } from "@/features/checkout/checkoutUtils";

function App() {
  // Navigation State
  const [view, setView] = useState("store");

  // Application Modal Overlays State & Actions
  const {
    isLoginOpen,
    setIsLoginOpen,
    loginMode,
    setLoginMode,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isOrderSuccessOpen,
    setIsOrderSuccessOpen,
    isMyOrdersOpen,
    setIsMyOrdersOpen,
    documentType,
    setDocumentType,
    customerDocument,
    setCustomerDocument,
    openLogin,
    openOrderSuccess,
    handleOpenMyOrdersFromSuccess
  } = useAppModals();

  // Centralized Auth State from AuthContext
  const { isLoggedIn, currentUser } = useAuth();

  // Centralized Cart State from CartContext
  const {
    cart,
    cartTotal,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    isCartOpen,
    closeCart,
    clearCart
  } = useCart();

  // Centralized Products State from useProducts
  const {
    products,
    setProducts,
    loadProducts,
    addProduct,
    updateProduct,
    deleteProduct
  } = useProducts();

  // Centralized Orders State from useOrders
  const {
    orders,
    setOrders,
    loadOrders,
    createOrder,
    shipOrder
  } = useOrders();

  // Centralized Production State from useProduction
  const {
    productionOrders,
    setProductionOrders,
    loadProductionOrders,
    createProductionOrder,
    updateStage: updateProductionStage
  } = useProduction();

  // Centralized Inventory / Kardex State from useInventory
  const {
    kardex,
    setKardex,
    loadKardex,
    addStock: handleInventoryAddStock
  } = useInventory();

  // Centralized Suppliers State from useSuppliers
  const {
    suppliers,
    setSuppliers,
    loadSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addRecord: addSupplierRecord,
    deleteRecord: deleteSupplierRecord
  } = useSuppliers();

  // Centralized Warehouse State from useWarehouse
  const {
    warehouseMovements,
    setWarehouseMovements,
    loadWarehouseMovements,
    acceptMovement: handleAcceptWarehouseMovementAction,
    createSalida: handleCreateWarehouseSalidaAction,
    createIngreso: handleCreateWarehouseIngresoAction
  } = useWarehouse();

  // Centralized Users State from useUsers
  const {
    users,
    setUsers,
    loadUsers,
    updateUser: handleUpdateUserAction,
    createUser: handleCreateUserAction
  } = useUsers();

  // Centralized Invoices State from useInvoices
  const {
    invoices,
    setInvoices,
    loadInvoices
  } = useInvoices();

  // Document & Billing Configuration
  const [invoiceSeries] = useState(INVOICE_SERIES);

  // Centralized Checkout Flow Orchestration
  const {
    checkout: processCheckoutAction,
    completedOrderData
  } = useCheckout({
    currentUser,
    cart,
    cartTotal,
    invoices,
    invoiceSeries,
    onProductsReload: loadProducts,
    onInvoicesReload: loadInvoices,
    onOrdersReload: loadOrders,
    onOrderCreated: (newOrder) => {
      setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
    },
    onProductionReload: loadProductionOrders,
    onProductionOrderCreated: (newOP) => {
      setProductionOrders((prev) => [newOP, ...prev.filter((o) => o.id !== newOP.id)]);
    },
    onInvoiceCreated: (newInv) => {
      setInvoices((prev) => [newInv, ...prev.filter((i) => i.id !== newInv.id)]);
    },
    onWarehouseReload: loadWarehouseMovements,
    onCartClear: clearCart,
    onRequireAuth: () => openLogin("login"),
    onSuccess: openOrderSuccess
  });

  // Ensure fresh orders and production orders automatically whenever navigating to admin view
  useEffect(() => {
    if (view === "admin") {
      loadOrders();
      loadProductionOrders();
      loadWarehouseMovements();
    }
  }, [view, loadOrders, loadProductionOrders, loadWarehouseMovements]);

  // Cross-Domain Orchestration Handlers
  const handleAcceptWarehouseMovement = async (movementId) => {
    try {
      const data = await handleAcceptWarehouseMovementAction(movementId);
      if (data && data.success) {
        loadProducts();
        loadOrders();
        loadProductionOrders();
        loadKardex();
      } else {
        alert(data?.message || "Error al aceptar el movimiento.");
      }
    } catch (err) {
      console.error("Error accepting movement:", err);
    }
  };

  const handleCreateSalida = async (payload) => {
    try {
      const data = await handleCreateWarehouseSalidaAction(payload);
      if (data && data.success) {
        loadProducts();
        loadOrders();
        loadProductionOrders();
        loadKardex();
      } else {
        alert(data?.message || "Error al crear salida.");
      }
      return data;
    } catch (err) {
      console.error("Error creating salida:", err);
    }
  };

  const handleCreateIngreso = async (payload) => {
    try {
      const data = await handleCreateWarehouseIngresoAction(payload);
      if (data && data.success) {
        loadProducts();
        loadOrders();
        loadProductionOrders();
        loadKardex();
      } else {
        alert(data?.message || "Error al crear ingreso.");
      }
      return data;
    } catch (err) {
      console.error("Error creating ingreso:", err);
    }
  };

  const handleUpdateStage = async (opId, stageName, status, responsible, supplierId) => {
    try {
      const result = await updateProductionStage(opId, stageName, status, responsible, supplierId);
      // Only reload suppliers non-blockingly if stage completion involved a third-party supplier
      if (status === "completed" && supplierId) {
        loadSuppliers();
      }
      return result;
    } catch (err) {
      console.error("Error updating stage status:", err);
    }
  };

  const handleCheckout = async (type = "direct", docType = "Boleta", docNumber = "00000000") => {
    return processCheckoutAction(type, docType, docNumber);
  };

  const handleShipOrder = async (orderId) => {
    try {
      const data = await shipOrder(orderId);
      if (data && data.success) {
        loadProducts();
        loadOrders();
        loadKardex();
        loadWarehouseMovements();
        alert(`¡Orden ${orderId} despachada exitosamente!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const onAddStock = async (id, q, reason, docRef, location) => {
    try {
      const data = await handleInventoryAddStock(id, q, reason, docRef, location);
      if (data && data.success) {
        loadProducts();
      }
    } catch (err) {
      console.error("Error adding stock:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans">
      {/* Navigation Bar Header */}
      <Navbar
        view={view}
        setView={setView}
        setIsLoginOpen={setIsLoginOpen}
        setIsMyOrdersOpen={setIsMyOrdersOpen}
      />

      {/* Main Content View routing with motion transitions */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {view === "store" && (
              <StorePage 
                products={products} 
                addToCart={addToCart} 
                isLoggedIn={isLoggedIn} 
                currentUser={currentUser} 
                setView={setView} 
              />
            )}
            
            {view === "products" && (
              <ProductsPage 
                products={products} 
                addToCart={addToCart} 
                isLoggedIn={isLoggedIn} 
                currentUser={currentUser} 
              />
            )}
            
            {view === "pedido" && (
              <OnDemandPage 
                products={products} 
                addToCart={addToCart} 
                isLoggedIn={isLoggedIn} 
                currentUser={currentUser} 
              />
            )}
            
            {view === "collections" && (
              <CollectionsPage 
                products={products} 
                addToCart={addToCart} 
              />
            )}
            
            {view === "about" && (
              <AboutUsPage />
            )}
            
            {view === "admin" && (
              <AdminPage
                products={products}
                setProducts={setProducts}
                onAddProduct={addProduct}
                onUpdateProduct={updateProduct}
                onDeleteProduct={deleteProduct}
                productionOrders={productionOrders}
                setProductionOrders={setProductionOrders}
                createProductionOrder={createProductionOrder}
                updateStage={handleUpdateStage}
                users={users}
                setUsers={setUsers}
                orders={orders}
                setOrders={setOrders}
                handleShipOrder={handleShipOrder}
                kardex={kardex}
                onAddStock={onAddStock}
                warehouseMovements={warehouseMovements}
                onAcceptWarehouseMovement={handleAcceptWarehouseMovement}
                onCreateSalida={handleCreateSalida}
                onCreateIngreso={handleCreateIngreso}
                invoices={invoices}
                setInvoices={setInvoices}
                suppliers={suppliers}
                setSuppliers={setSuppliers}
                onAddSupplier={addSupplier}
                onUpdateSupplier={updateSupplier}
                onDeleteSupplier={deleteSupplier}
                onAddSupplierRecord={addSupplierRecord}
                onDeleteSupplierRecord={deleteSupplierRecord}
                loadSuppliers={loadSuppliers}
                loadOrders={loadOrders}
                loadProductionOrders={loadProductionOrders}
                loadWarehouseMovements={loadWarehouseMovements}
                currentUser={currentUser}
                setView={setView}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Store Layout Footer */}
      {view !== "admin" && <Footer setView={setView} />}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        loginMode={loginMode}
        setLoginMode={setLoginMode}
        setUsers={setUsers}
        setView={setView}
      />

      {/* Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={closeCart}
        cart={cart}
        removeFromCart={removeFromCart}
        updateCartQuantity={updateCartQuantity}
        cartTotal={cartTotal}
        isLoggedIn={isLoggedIn}
        setIsLoginOpen={setIsLoginOpen}
        setIsPaymentModalOpen={setIsPaymentModalOpen}
      />

      {/* Payment Gateway Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        cart={cart}
        cartTotal={cartTotal}
        currentUser={currentUser}
        isLoggedIn={isLoggedIn}
        handleCheckout={handleCheckout}
        documentType={documentType}
        setDocumentType={setDocumentType}
        customerDocument={customerDocument}
        setCustomerDocument={setCustomerDocument}
      />

      {/* Order Success Modal */}
      <OrderSuccessModal
        isOpen={isOrderSuccessOpen}
        onClose={() => setIsOrderSuccessOpen(false)}
        orderData={completedOrderData}
        currentUser={currentUser}
        onOpenMyOrders={handleOpenMyOrdersFromSuccess}
      />

      {/* Customer Orders & Invoice History Modal */}
      <MyOrdersModal
        isOpen={isMyOrdersOpen}
        onClose={() => setIsMyOrdersOpen(false)}
        orders={orders}
        invoices={invoices}
        currentUser={currentUser}
      />
    </div>
  );
}

export default App;

import OrderModel from "../models/Order.js";
import ProductModel from "../models/Product.js";
import WarehouseMovementModel from "../models/WarehouseMovement.js";
import InvoiceModel from "../models/Invoice.js";
import KardexModel from "../models/Kardex.js";
import ProductionOrderModel from "../models/ProductionOrder.js";

export const getOrders = async (req, res, next) => {
  try {
    const list = await OrderModel.find().sort({ _id: -1 });
    res.json(list);
  } catch (err) {
    next(err);
  }
};

export const createOrder = async (req, res, next) => {
  try {
    const { order, docType, docNumber, invoiceSeriesNumber, productionOrder } = req.body;
    
    // Update stocks if "direct" checkout (Venta Directa)
    if (order.type === "direct") {
      for (const item of order.items) {
        const product = await ProductModel.findOne({ id: item.productId });
        if (product) {
          const committed = (product.stockCommitted || 0) + item.quantity;
          await ProductModel.findOneAndUpdate(
            { id: item.productId },
            { $set: { stockCommitted: committed } }
          );
        }
      }

      // Generate automatic pending Salida (S-XXX) for Venta Directa
      const movementId = `S-${(Math.floor(Math.random() * 900) + 100).toString()}`;
      await WarehouseMovementModel.create({
        id: movementId,
        type: "Salida",
        originType: "Venta Directa",
        status: "Pendiente",
        orderId: order.id,
        items: order.items.map((i) => ({
          productId: i.productId,
          productName: i.productName || "Prenda",
          quantity: i.quantity,
          selectedSize: i.selectedSize
        })),
        date: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString()
      });
    }

    // Create Order in DB
    const newOrder = await OrderModel.create(order);

    // Create Invoice
    const subtotal = order.total / 1.18;
    const igv = order.total - subtotal;
    const invoiceNum = invoiceSeriesNumber || (Math.floor(Math.random() * 900000) + 100000).toString();
    const newInvoice = {
      id: `INV-${Date.now()}`,
      orderId: order.id,
      type: docType || "Boleta",
      series: docType === "Boleta" ? "B001" : "F001",
      number: invoiceNum,
      customerName: order.customerName,
      customerDocument: docNumber || "00000000",
      date: new Date().toISOString().split("T")[0],
      items: order.items,
      subtotal: Number(subtotal.toFixed(2)),
      igv: Number(igv.toFixed(2)),
      total: order.total,
      status: "Emitido"
    };

    const createdInvoice = await InvoiceModel.create(newInvoice);

    // If on-demand order ("pedido"), create production order automatically in the same request
    let createdOP = null;
    if (order.type !== "direct") {
      try {
        if (productionOrder && productionOrder.id) {
          createdOP = await ProductionOrderModel.create(productionOrder);
        } else {
          const defaultOpPayload = {
            id: `OP-${Math.floor(Math.random() * 1e3).toString().padStart(3, "0")}`,
            orderId: order.id,
            items: (order.items || []).map((i) => ({
              productId: i.productId,
              productName: i.productName || "Prenda",
              quantityOrdered: i.quantity || 1,
              quantityExtras: 0,
              selectedSize: i.selectedSize,
              sizeDistribution: i.sizeDistribution
            })),
            currentStage: "Tendido",
            progress: 0,
            startDate: new Date().toISOString().split("T")[0],
            stages: [
              { name: "Tendido", status: "in-progress", responsible: "Operario de Tendido", startTime: new Date().toLocaleString() },
              { name: "Corte", status: "pending", responsible: "" },
              { name: "Costura", status: "pending", responsible: "" },
              { name: "Limpieza", status: "pending", responsible: "" },
              { name: "Planchado y Empaquetado", status: "pending", responsible: "" }
            ]
          };
          createdOP = await ProductionOrderModel.create(defaultOpPayload);
        }
      } catch (opErr) {
        console.error("Error creating OP during createOrder:", opErr);
      }
    }

    res.json({ success: true, order: newOrder, invoice: createdInvoice, productionOrder: createdOP });
  } catch (err) {
    next(err);
  }
};

export const shipOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await OrderModel.findOne({ id: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Orden no encontrada" });
    }

    // Mark order as shipped
    const updatedOrder = await OrderModel.findOneAndUpdate(
      { id: orderId },
      { 
        $set: { 
          status: "Enviado",
          shippedAt: new Date().toISOString()
        } 
      },
      { new: true }
    );

    // Check if a Salida movement was already accepted by Warehouse
    const existingAcceptedSalida = await WarehouseMovementModel.findOne({ 
      orderId: orderId, 
      type: "Salida", 
      status: "Aceptado" 
    });

    // If warehouse has NOT already deducted stock via an accepted Salida movement, perform fallback deduction
    if (!existingAcceptedSalida) {
      for (const item of order.items || []) {
        const prod = await ProductModel.findOne({ id: item.productId });
        if (prod) {
          const qty = item.quantity || 1;
          const newPhysical = Math.max(0, (prod.stockPhysical || 0) - qty);
          const newCommitted = Math.max(0, (prod.stockCommitted || 0) - qty);
          await ProductModel.findOneAndUpdate(
            { id: item.productId },
            { $set: { stockPhysical: newPhysical, stockCommitted: newCommitted } }
          );

          // Kardex entry
          await KardexModel.create({
            productId: item.productId,
            date: new Date().toISOString().split("T")[0],
            type: "Salida",
            quantity: qty,
            reason: `Despacho Directo Orden ${orderId}`,
            documentRef: orderId,
            balance: newPhysical
          });
        }
      }

      const movementId = `S-${(Math.floor(Math.random() * 900) + 100).toString()}`;
      await WarehouseMovementModel.create({
        id: movementId,
        type: "Salida",
        originType: order.type === "pedido" ? "A Pedido" : "Venta Directa",
        status: "Aceptado",
        orderId: order.id,
        items: (order.items || []).map((i) => ({
          productId: i.productId,
          productName: i.productName || "Prenda",
          quantity: i.quantity || 1,
          selectedSize: i.selectedSize
        })),
        date: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
        processedAt: new Date().toISOString()
      });
    }

    res.json({ success: true, order: updatedOrder });
  } catch (err) {
    next(err);
  }
};

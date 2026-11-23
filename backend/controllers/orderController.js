import OrderModel from "../models/Order.js";
import ProductModel from "../models/Product.js";
import WarehouseMovementModel from "../models/WarehouseMovement.js";
import InvoiceModel from "../models/Invoice.js";
import { randomUUID } from "node:crypto";
import { salidaService } from "../services/salidaService.js";
import { flowError } from "../utils/guideValidation.js";
import ProductionOrderModel from "../models/ProductionOrder.js";
import UserModel from "../models/User.js";

const CREDIT_LIMIT_EXCEEDED_MESSAGE = "Excede su linea de credito";

export const getOrders = async (req, res, next) => {
  try {
    const filter = req.user?.role === "admin"
      ? {}
      : { userId: req.currentUser.id };
    const list = await OrderModel.find(filter).sort({ _id: -1 }).lean();
    const orderIds = list.map((order) => order.id).filter(Boolean);
    const productionOrders = orderIds.length
      ? await ProductionOrderModel.find({ orderId: { $in: orderIds } })
        .select("id orderId currentStage progress stages")
        .lean()
      : [];
    const productionByOrderId = new Map(
      productionOrders.map((productionOrder) => [productionOrder.orderId, productionOrder])
    );

    res.json(list.map((order) => {
      const production = productionByOrderId.get(order.id);
      return production ? { ...order, production } : order;
    }));
  } catch (err) {
    next(err);
  }
};

export const createOrder = async (req, res, next) => {
  let reservedCredit = 0;
  let creditUserId = null;
  try {
    const { order, docType, docNumber, invoiceSeriesNumber, productionOrder } = req.body;
    if (order?.status === "Enviado") throw flowError("Un pedido nuevo no puede crearse como despachado.");

    if (!order || !Array.isArray(order.items) || !Number.isFinite(Number(order.total)) || Number(order.total) <= 0) {
      return res.status(400).json({ success: false, message: "La orden no tiene un total o artículos válidos." });
    }
    if (!["direct", "pedido"].includes(order.type) || order.items.length === 0 || order.items.length > 100) {
      return res.status(400).json({ success: false, message: "La orden contiene datos inválidos." });
    }
    if (await OrderModel.exists({ id: order.id })) {
      return res.status(409).json({ success: false, message: "La orden ya fue procesada." });
    }
    if (!req.currentUser || req.currentUser.id !== order.userId) {
      return res.status(403).json({ success: false, message: "La orden no pertenece al usuario autenticado." });
    }

    const normalizedItems = order.items.map((item) => ({
      ...item,
      productId: typeof item?.productId === "string"
        ? item.productId.trim()
        : String(item?.productId ?? "").trim()
    }));
    const productIds = normalizedItems.map((item) => item.productId);
    if (productIds.some((id) => typeof id !== "string" || !id.trim())) {
      return res.status(400).json({ success: false, message: "Los productos de la orden no son válidos." });
    }
    const products = await ProductModel.find({ id: { $in: productIds } }).lean();
    const productsById = new Map(products.map((product) => [product.id, product]));
    let computedTotal = 0;
    const validatedItems = [];

    for (const item of normalizedItems) {
      const product = productsById.get(item.productId);
      const quantity = Number(item.quantity);
      if (!product || !Number.isInteger(quantity) || quantity <= 0 || quantity > 1000) {
        return res.status(400).json({ success: false, message: "La cantidad o producto de la orden no es válido." });
      }
      if (!Number.isFinite(Number(product.price)) || Number(product.price) < 0) {
        return res.status(400).json({ success: false, message: "El producto tiene un precio inválido." });
      }
      computedTotal += Number(product.price) * quantity;
      validatedItems.push({
        productId: product.id,
        productName: product.name,
        quantity,
        price: Number(product.price),
        selectedSize: typeof item.selectedSize === "string" ? item.selectedSize.slice(0, 50) : undefined,
        sizeDistribution: item.sizeDistribution
      });
    }
    computedTotal = Number(computedTotal.toFixed(2));
    const safeOrder = {
      warehouseGuideVersion: 1,
      id: order.id,
      userId: req.currentUser.id,
      customerName: req.currentUser.name,
      items: validatedItems,
      total: computedTotal,
      type: order.type,
      status: order.type === "pedido" ? "Pagado Parcial" : "Pagado Total",
      date: new Date().toISOString().split("T")[0],
      ...(order.type === "pedido" ? {
        initialPayment: Number((computedTotal * 0.5).toFixed(2)),
        estimatedDelivery: order.estimatedDelivery,
        installments: order.installments
      } : {})
    };

    if (order.type === "pedido") {
      const currentUser = req.currentUser;
      const orderTotal = computedTotal;
      const creditLimit = Number(currentUser?.creditLimit);

      if (
        !currentUser.creditEnabled ||
        !Number.isFinite(creditLimit) ||
        creditLimit <= 0 ||
        !Number.isFinite(orderTotal) ||
        orderTotal <= 0
      ) {
        return res.status(409).json({
          success: false,
          code: "CREDIT_LIMIT_EXCEEDED",
          message: CREDIT_LIMIT_EXCEEDED_MESSAGE
        });
      }

      const previousOrders = await OrderModel.find({
        type: "pedido",
        id: { $ne: order.id },
        $or: [
          { userId: currentUser.id },
          { customerName: currentUser.name }
        ]
      }).select("total").lean();
      const historicalUsed = previousOrders.reduce((sum, previousOrder) => {
        const total = Number(previousOrder.total);
        return sum + (Number.isFinite(total) && total > 0 ? total : 0);
      }, 0);
      const persistedUsed = Number(currentUser.creditUsed);
      const effectiveUsed = Math.max(
        historicalUsed,
        Number.isFinite(persistedUsed) && persistedUsed > 0 ? persistedUsed : 0
      );
      const availableCredit = Math.max(creditLimit - effectiveUsed, 0);

      if (orderTotal > availableCredit) {
        return res.status(409).json({
          success: false,
          code: "CREDIT_LIMIT_EXCEEDED",
          message: CREDIT_LIMIT_EXCEEDED_MESSAGE
        });
      }

      // Reconcile legacy records first, then reserve the new order amount.
      const creditReservation = await UserModel.findOneAndUpdate(
        {
          id: currentUser.id,
          creditEnabled: true,
          creditLimit: { $gte: effectiveUsed + orderTotal },
          creditUsed: { $lte: effectiveUsed }
        },
        { $set: { creditUsed: effectiveUsed + orderTotal } },
        { new: true }
      );

      if (!creditReservation) {
        return res.status(409).json({
          success: false,
          code: "CREDIT_LIMIT_EXCEEDED",
          message: CREDIT_LIMIT_EXCEEDED_MESSAGE
        });
      }

      reservedCredit = orderTotal;
      creditUserId = currentUser.id;
    }
    
    // Update stocks if "direct" checkout (Venta Directa)
    if (order.type === "direct") {
      const stockAvailable = validatedItems.every((item) => {
        const product = productsById.get(item.productId);
        return Number(product.stockPhysical || 0) - Number(product.stockCommitted || 0) >= item.quantity;
      });
      if (!stockAvailable) {
        return res.status(409).json({ success: false, message: "Stock insuficiente para completar la compra." });
      }
      for (const item of validatedItems) {
        const updatedProduct = await ProductModel.findOneAndUpdate(
          {
            id: item.productId,
            $expr: {
              $gte: [
                {
                  $subtract: [
                    { $ifNull: ["$stockPhysical", 0] },
                    { $ifNull: ["$stockCommitted", 0] }
                  ]
                },
                item.quantity
              ]
            }
          },
          { $inc: { stockCommitted: item.quantity } },
          { new: true }
        );
        if (!updatedProduct) {
          return res.status(409).json({ success: false, message: "Stock insuficiente para completar la compra." });
        }
      }

      // Generate automatic pending Salida (S-XXX) for Venta Directa
      const movementId = `S-${randomUUID()}`;
      await WarehouseMovementModel.create({
        id: movementId,
        type: "Salida",
        originType: "Venta Directa",
        guideVersion: 1,
        automaticDraft: true,
        status: "Pendiente",
        orderId: order.id,
        items: validatedItems.map((i) => ({
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
    if (computedTotal <= 0) {
      return res.status(400).json({ success: false, message: "El total calculado de la orden no es válido." });
    }

    const newOrder = await OrderModel.create(safeOrder);

    // Create Invoice
    const subtotal = computedTotal / 1.18;
    const igv = computedTotal - subtotal;
    const invoiceNum = invoiceSeriesNumber || (Math.floor(Math.random() * 900000) + 100000).toString();
    const newInvoice = {
      id: `INV-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      orderId: order.id,
      type: docType || "Boleta",
      series: docType === "Boleta" ? "B001" : "F001",
      number: invoiceNum,
      customerName: safeOrder.customerName,
      customerDocument: docNumber || "00000000",
      date: new Date().toISOString().split("T")[0],
      items: validatedItems,
      subtotal: Number(subtotal.toFixed(2)),
      igv: Number(igv.toFixed(2)),
      total: computedTotal,
      status: "Emitido"
    };

    const createdInvoice = await InvoiceModel.create(newInvoice);

    // If on-demand order ("pedido"), create production order automatically in the same request
    let createdOP = null;
    if (safeOrder.type !== "direct") {
      try {
        const defaultOpPayload = {
            id: `OP-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
            orderId: safeOrder.id,
            items: validatedItems.map((i) => ({
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
      } catch (opErr) {
        console.error("Error creating OP during createOrder:", opErr);
      }
    }

    const updatedUser = creditUserId
      ? await UserModel.findOne({ id: creditUserId }).select("-password").lean()
      : null;

    res.json({
      success: true,
      order: newOrder,
      invoice: createdInvoice,
      productionOrder: createdOP,
      user: updatedUser
    });
  } catch (err) {
    if (reservedCredit && creditUserId) {
      await UserModel.findOneAndUpdate(
        { id: creditUserId, creditUsed: { $gte: reservedCredit } },
        { $inc: { creditUsed: -reservedCredit } }
      ).catch((rollbackError) => {
        console.error("Error rolling back credit reservation:", rollbackError);
      });
    }
    next(err);
  }
};

export const shipOrder = async (req, res, next) => {
  try {
    const order = await salidaService.ship(req.body);
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

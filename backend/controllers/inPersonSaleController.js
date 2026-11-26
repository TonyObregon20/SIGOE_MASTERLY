import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Invoice from "../models/Invoice.js";
import Movement from "../models/WarehouseMovement.js";
import Kardex from "../models/Kardex.js";
import User from "../models/User.js";
import { createInPersonSaleService, SaleError } from "../services/inPersonSaleService.js";

const registerSale = createInPersonSaleService({
  Order, Product, Invoice, Movement, Kardex, User,
  transaction: callback => Order.db.transaction(callback)
});

export async function createInPersonSale(req, res, next) {
  try {
    const result = await registerSale({ input: req.body, actor: req.currentUser });
    res.status(result.replayed ? 200 : 201).json({ success: true, ...result });
  } catch (error) {
    if (error instanceof SaleError) return res.status(error.status).json({ success: false, message: error.message, field: error.field });
    next(error);
  }
}

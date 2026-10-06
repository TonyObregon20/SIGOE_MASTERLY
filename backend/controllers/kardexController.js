import KardexModel from "../models/Kardex.js";
import ProductModel from "../models/Product.js";

export const getKardex = async (req, res, next) => {
  try {
    const list = await KardexModel.find();
    res.json(list);
  } catch (err) {
    next(err);
  }
};

export const addStock = async (req, res, next) => {
  try {
    const { productId, quantity, reason, documentRef, location } = req.body;
    const product = await ProductModel.findOne({ id: productId });
    if (!product) {
      return res.status(404).json({ success: false, message: "Producto no encontrado" });
    }

    const newPhysical = (product.stockPhysical || 0) + quantity;
    await ProductModel.findOneAndUpdate(
      { id: productId },
      { $set: { stockPhysical: newPhysical } }
    );

    const entry = await KardexModel.create({
      productId,
      date: new Date().toISOString().split("T")[0],
      type: "Ingreso",
      quantity,
      reason,
      documentRef,
      location,
      balance: newPhysical
    });

    res.json({ success: true, kardex: entry, product: { id: productId, stockPhysical: newPhysical } });
  } catch (err) {
    next(err);
  }
};

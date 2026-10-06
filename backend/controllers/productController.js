import { ProductModel } from "../models/Product.js";

export const getProducts = async (req, res, next) => {
  try {
    const list = await ProductModel.find();
    res.json(list);
  } catch (err) {
    next(err);
  }
};

export const createOrUpdateProduct = async (req, res, next) => {
  try {
    const productData = req.body;

    // Si viene la distribución de tallas, asegurar que stockPhysical total refleje la suma
    if (productData.sizes && typeof productData.sizes === "object") {
      let totalPhysicalFromSizes = 0;
      Object.keys(productData.sizes).forEach((sz) => {
        const item = productData.sizes[sz];
        const qty = typeof item === "number" ? item : (Number(item?.stockPhysical) || 0);
        totalPhysicalFromSizes += qty;
        // Normalizar estructura
        productData.sizes[sz] = {
          stockPhysical: qty,
          stockCommitted: typeof item === "object" ? (Number(item?.stockCommitted) || 0) : 0
        };
      });
      productData.stockPhysical = totalPhysicalFromSizes;
    }

    if (productData.id) {
      const updated = await ProductModel.findOneAndUpdate(
        { id: productData.id },
        { $set: productData },
        { new: true }
      );
      res.json({ success: true, product: updated });
    } else {
      const id = (Math.floor(Math.random() * 9000) + 1000).toString(); // Generate unique 4 digit id
      const newProduct = await ProductModel.create({ ...productData, id });
      res.json({ success: true, product: newProduct });
    }
  } catch (err) {
    next(err);
  }
};

import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  stockPhysical: { type: Number, default: 0 },
  stockCommitted: { type: Number, default: 0 },
  minStock: { type: Number, default: 0 },
  sizes: { type: mongoose.Schema.Types.Mixed, default: {} },
  category: { type: String },
  description: { type: String },
  isPublic: { type: Boolean, default: true }
}, { strict: false });

export const ProductModel = mongoose.models.Product || mongoose.model("Product", ProductSchema);
export const Product = ProductModel;
export default ProductModel;

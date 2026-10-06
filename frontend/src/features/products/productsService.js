import {
  getProductsApi,
  createProductApi,
  updateProductApi,
  deleteProductApi
} from "./productsApi";

/**
 * Products domain service layer
 * Handles business-level operations and communicates with the products API.
 */
export const productsService = {
  async getProducts() {
    const data = await getProductsApi();
    return Array.isArray(data) ? data : [];
  },

  async createProduct(productData) {
    const payload = {
      ...productData,
      isPublic: productData.isPublic !== undefined ? productData.isPublic : true,
      stockCommitted: productData.stockCommitted || 0
    };
    const response = await createProductApi(payload);
    return response;
  },

  async updateProduct(id, updates) {
    const response = await updateProductApi(id, updates);
    return response;
  },

  async deleteProduct(id) {
    const response = await deleteProductApi(id);
    return response;
  }
};

export const productService = productsService;
export default productsService;

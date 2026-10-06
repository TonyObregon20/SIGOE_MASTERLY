import { useState, useEffect, useCallback } from "react";
import { productsService } from "../productsService";

/**
 * Custom hook to manage products state, loading, errors and domain operations.
 */
export function useProducts(autoLoad = true) {
  const [products, setProductsState] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productsService.getProducts();
      if (Array.isArray(data)) {
        setProductsState(data);
      }
      return data;
    } catch (err) {
      console.error("Error loading products:", err);
      setError(err.message || "Error al cargar productos");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const addProduct = useCallback(async (productData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await productsService.createProduct(productData);
      await loadProducts();
      return result;
    } catch (err) {
      console.error("Error adding product:", err);
      setError(err.message || "Error al crear producto");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadProducts]);

  const updateProduct = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);
    try {
      const result = await productsService.updateProduct(id, updates);
      await loadProducts();
      return result;
    } catch (err) {
      console.error("Error updating product:", err);
      setError(err.message || "Error al actualizar producto");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadProducts]);

  const deleteProduct = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await productsService.deleteProduct(id);
      await loadProducts();
      return result;
    } catch (err) {
      console.error("Error deleting product:", err);
      setError(err.message || "Error al eliminar producto");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadProducts]);


  /**
   * Flexible setProducts supporting direct values and updater functions
   * with automatic domain synchronization.
   */
  const setProducts = useCallback((updaterOrValue) => {
    if (typeof updaterOrValue === "function") {
      setProductsState((prevProducts) => {
        const nextProducts = updaterOrValue(prevProducts);
        if (Array.isArray(nextProducts)) {
          if (nextProducts.length > prevProducts.length) {
            const added = nextProducts[nextProducts.length - 1];
            if (added) {
              addProduct(added).catch((err) => console.error("Error adding product:", err));
            }
          } else {
            nextProducts.forEach((p) => {
              const prev = prevProducts.find((x) => x.id === p.id);
              if (prev && JSON.stringify(prev) !== JSON.stringify(p)) {
                updateProduct(p.id, p).catch((err) => console.error("Error updating product:", err));
              }
            });
          }
          return nextProducts;
        }
        return prevProducts;
      });
    } else {
      setProductsState(updaterOrValue);
    }
  }, [addProduct, updateProduct]);

  useEffect(() => {
    if (autoLoad) {
      loadProducts();
    }
  }, [autoLoad, loadProducts]);

  return {
    products,
    setProducts,
    loading,
    error,
    loadProducts,
    addProduct,
    updateProduct,
    deleteProduct
  };
}

export default useProducts;

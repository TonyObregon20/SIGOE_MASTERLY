/**
 * Preset images and categories for apparel products
 */
export const APPAREL_PRESETS = [
  {
    name: "Camisa Oxford Blanca Premium",
    url: "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=800",
    category: "Formal"
  },
  {
    name: "Camisa Lino Azul Cielo",
    url: "https://images.unsplash.com/photo-1598032895397-b9472434ef93?auto=format&fit=crop&q=80&w=800",
    category: "Casual"
  },
  {
    name: "Camisa Franela Cuadros Roja",
    url: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80&w=800",
    category: "Casual"
  },
  {
    name: "Camisa de Pana Verde Bosque",
    url: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=800",
    category: "Exterior"
  }
];

/**
 * Pure utility functions for products domain logic
 */

/**
 * Calculates Ecommerce KPI metrics
 */
export function calculateEcommerceMetrics(products = [], orders = []) {
  const totalProductsCount = products.length;
  const publicProductsCount = products.filter((p) => p.isPublic !== false).length;
  const hiddenProductsCount = products.filter((p) => p.isPublic === false).length;
  const avgPrice = products.length > 0
    ? products.reduce((sum, p) => sum + (Number(p.price) || 0), 0) / products.length
    : 0;

  const webOrders = orders.filter((o) => o.type === "pedido" || o.type === "direct");
  const webTotalSales = webOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const webOrdersCount = webOrders.length;

  return {
    totalProductsCount,
    publicProductsCount,
    hiddenProductsCount,
    avgPrice,
    webOrders,
    webTotalSales,
    webOrdersCount
  };
}

/**
 * Calculates available stock taking into account physical and committed inventory
 * If size is passed, calculates available stock for that specific size.
 */
export function getAvailableStock(product, size = null) {
  if (!product) return 0;

  if (size) {
    if (product.sizes && product.sizes[size]) {
      const szObj = product.sizes[size];
      const physical = typeof szObj === "number" ? szObj : (Number(szObj.stockPhysical) || 0);
      const committed = typeof szObj === "object" ? (Number(szObj.stockCommitted) || 0) : 0;
      return Math.max(0, physical - committed);
    }
    // Si no tiene la talla configurada, no devolver el total general (evita mostrar 50/50/50/50)
    const physical = Number(product.stockPhysical) || 0;
    const committed = Number(product.stockCommitted) || 0;
    const totalAvail = Math.max(0, physical - committed);
    // Si no hay desglose, estimar equitativo por 4 tallas en vez de poner 50 a cada una
    return Math.floor(totalAvail / 4);
  }

  // Stock global
  const physical = Number(product.stockPhysical) || 0;
  const committed = Number(product.stockCommitted) || 0;
  return Math.max(0, physical - committed);
}

/**
 * Gets stock available breakdown by each standard size [S, M, L, XL]
 */
export function getSizeStockBreakdown(product) {
  const standardSizes = ["S", "M", "L", "XL"];
  const breakdown = {};

  if (!product) {
    standardSizes.forEach((sz) => { breakdown[sz] = 0; });
    return breakdown;
  }

  standardSizes.forEach((sz) => {
    if (product.sizes && product.sizes[sz] !== undefined) {
      const szObj = product.sizes[sz];
      const physical = typeof szObj === "number" ? szObj : (Number(szObj.stockPhysical) || 0);
      const committed = typeof szObj === "object" ? (Number(szObj.stockCommitted) || 0) : 0;
      breakdown[sz] = Math.max(0, physical - committed);
    } else {
      const physical = Number(product.stockPhysical) || 0;
      const committed = Number(product.stockCommitted) || 0;
      const totalAvail = Math.max(0, physical - committed);
      // Distribución por defecto proporcional para no duplicar el total
      const base = Math.floor(totalAvail / 4);
      breakdown[sz] = sz === "XL" ? (totalAvail - base * 3) : base;
    }
  });

  return breakdown;
}

/**
 * Checks if a product has available stock for immediate delivery
 */
export function isProductAvailable(product, size = null) {
  return getAvailableStock(product, size) > 0;
}

/**
 * Filters out hidden/non-public products for client-facing views
 */
export function filterPublicProducts(products = []) {
  return products.filter((p) => p.isPublic !== false);
}

/**
 * Filters products by category (supports 'Todos' and 'all')
 */
export function filterProductsByCategory(products = [], category = "Todos") {
  if (!category || category === "Todos" || category === "all") {
    return products;
  }
  return products.filter((p) => p.category === category);
}

/**
 * Searches products by name, category, or ID (case-insensitive)
 */
export function searchProducts(products = [], query = "") {
  if (!query || !query.trim()) return products;
  const cleanQuery = query.trim().toLowerCase();
  return products.filter((p) => {
    const nameMatch = p.name ? p.name.toLowerCase().includes(cleanQuery) : false;
    const catMatch = p.category ? p.category.toLowerCase().includes(cleanQuery) : false;
    const idMatch = p.id ? String(p.id).toLowerCase().includes(cleanQuery) : false;
    return nameMatch || catMatch || idMatch;
  });
}

/**
 * Filters products within a price range
 */
export function filterProductsByPriceRange(products = [], minPrice = 0, maxPrice = Infinity) {
  return products.filter((p) => {
    const price = Number(p.price) || 0;
    return price >= minPrice && price <= maxPrice;
  });
}

/**
 * Sorts products according to sort type
 */
export function sortProducts(products = [], sortBy = "featured") {
  const sorted = [...products];
  if (sortBy === "price-asc") {
    return sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
  }
  if (sortBy === "price-desc") {
    return sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  }
  return sorted;
}

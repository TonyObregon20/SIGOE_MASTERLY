/**
 * Pure utility functions for cart calculations and comparisons.
 */

export function isSameCartItem(item, productId, selectedSize, sizeDistribution) {
  if (!item || !item.product) return false;
  const isSameProduct = item.product.id === productId;
  const isSameSize = item.selectedSize === selectedSize;
  const isSameDistribution = JSON.stringify(item.sizeDistribution) === JSON.stringify(sizeDistribution);
  return isSameProduct && isSameSize && isSameDistribution;
}

export function calculateCartTotal(cart = []) {
  return cart.reduce((acc, item) => {
    const price = item?.product?.price || 0;
    const quantity = item?.quantity || 0;
    return acc + price * quantity;
  }, 0);
}

export function calculateCartCount(cart = []) {
  return cart.reduce((acc, item) => acc + (item?.quantity || 0), 0);
}

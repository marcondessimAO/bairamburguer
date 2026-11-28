export type QuantityPricedProduct = {
  price: number;
  quantityPromotionMin?: number | null;
  quantityPromotionPrice?: number | null;
};

export function getQuantityPromotion(product: QuantityPricedProduct) {
  const minimum = product.quantityPromotionMin;
  const price = Number(product.quantityPromotionPrice);
  return minimum != null && Number.isInteger(minimum) && minimum >= 2
    && Number.isFinite(price) && price > 0 && price < Number(product.price)
    ? { minimum, price }
    : null;
}

export function getProductUnitPrice(product: QuantityPricedProduct, quantity: number) {
  const promotion = getQuantityPromotion(product);
  return promotion && quantity >= promotion.minimum ? promotion.price : Number(product.price);
}

export function getQuantityPromotionLabel(product: QuantityPricedProduct) {
  const promotion = getQuantityPromotion(product);
  if (!promotion) return null;
  const price = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(promotion.price);
  return `A partir de ${promotion.minimum} unidades: ${price} cada`;
}

export function getProductQuantity(
  items: ReadonlyArray<{ product: { id: number }; quantity: number }>, productId: number,
) {
  return items.reduce((sum, item) => sum + (item.product.id === productId ? item.quantity : 0), 0);
}

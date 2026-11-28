import { describe, expect, it } from 'vitest';
import { getProductQuantity, getProductUnitPrice } from './quantityPricing';

const cheddar = { id: 1, price: 20, quantityPromotionMin: 3, quantityPromotionPrice: 15 };

describe('quantity promotion', () => {
  it('applies only at the configured minimum and restores the regular price below it', () => {
    expect(getProductUnitPrice(cheddar, 2)).toBe(20);
    expect(getProductUnitPrice(cheddar, 3)).toBe(15);
    expect(getProductUnitPrice(cheddar, 4)).toBe(15);
    expect(getProductUnitPrice(cheddar, 2)).toBe(20);
    expect(getProductUnitPrice({ ...cheddar, quantityPromotionMin: 4 }, 3)).toBe(20);
  });

  it('counts the same product across different addon selections without counting other products', () => {
    const lines = [{ product: cheddar, quantity: 2 }, { product: cheddar, quantity: 1 }, { product: { id: 2 }, quantity: 5 }];
    expect(getProductQuantity(lines, 1)).toBe(3);
    expect(getProductUnitPrice(cheddar, getProductQuantity(lines, 1))).toBe(15);
    expect(getProductUnitPrice({ price: 20 }, 10)).toBe(20);
  });

  it('does not use an invalid or incomplete promotional price', () => {
    expect(getProductUnitPrice({ ...cheddar, quantityPromotionPrice: null }, 3)).toBe(20);
    expect(getProductUnitPrice({ ...cheddar, quantityPromotionPrice: 25 }, 3)).toBe(20);
  });
});

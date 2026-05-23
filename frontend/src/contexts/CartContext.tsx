"use client";

import React, { createContext, useContext, useState, useMemo, ReactNode } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type Product = {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category: { name: string };
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type Neighborhood = {
  name: string;
  fee: number;
};

// ─── Tabela de Bairros (RF08) ─────────────────────────────────────────────────

export const NEIGHBORHOODS: Neighborhood[] = [
  { name: "Mangabeira", fee: 5.0 },
  { name: "Bancários", fee: 7.0 },
  { name: "Cabo Branco", fee: 10.0 },
  { name: "Tambaú", fee: 10.0 },
  { name: "Centro", fee: 8.0 },
];

// ─── Interface do Contexto ────────────────────────────────────────────────────

interface CartContextData {
  cartItems: CartItem[];
  isCartOpen: boolean;
  deliveryNeighborhood: Neighborhood | null;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  setIsCartOpen: (isOpen: boolean) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  setNeighborhood: (neighborhoodName: string) => void;
  clearCart: () => void;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextData>({} as CartContextData);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryNeighborhood, setDeliveryNeighborhoodState] = useState<Neighborhood | null>(null);

  const subtotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
    [cartItems]
  );

  const deliveryFee = deliveryNeighborhood?.fee ?? 0;
  const totalAmount = subtotal + deliveryFee;

  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: number) => {
    setCartItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  };

  const setNeighborhood = (neighborhoodName: string) => {
    const found = NEIGHBORHOODS.find((n) => n.name === neighborhoodName) ?? null;
    setDeliveryNeighborhoodState(found);
  };

  const clearCart = () => setCartItems([]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        deliveryNeighborhood,
        subtotal,
        deliveryFee,
        totalAmount,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        setNeighborhood,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useCart = () => useContext(CartContext);

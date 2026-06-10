"use client";

import React, { createContext, useContext, useMemo, useState, ReactNode } from "react";

export type Product = {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  isPromotion: boolean;
  category: { name: string };
};

export type CartAddonSelection = {
  beverageAddon?: "FANTA" | "PEPSI" | "COCA_COLA" | "GUARANA";
  friesAddon?: boolean;
};

export type CartItem = {
  id: string;
  product: Product;
  quantity: number;
  addons?: CartAddonSelection;
  addonsSummary?: string;
  addonsTotal: number;
};

export type Neighborhood = {
  name: string;
  fee: number;
};

export type PendingPayment = {
  orderId: number;
  totalAmount: number;
  pixQrCodeBase64?: string;
  pixCopiaECola?: string;
};

export const NEIGHBORHOODS: Neighborhood[] = [
  { name: "Mangabeira", fee: 0.0 },
  { name: "Valentina", fee: 5.99 },
  { name: "Mucumagro", fee: 5.99 },
  { name: "Gramame", fee: 5.99 },
  { name: "Paratibe", fee: 5.99 },
  { name: "Nova Mangabeira", fee: 5.99 },
  { name: "Parque do Sol", fee: 5.99 },
  { name: "Portal do Sol", fee: 5.99 },
  { name: "Jose Americo", fee: 4.99 },
  { name: "Colibris", fee: 4.99 },
  { name: "Cidade Verde", fee: 4.99 },
  { name: "Bancarios", fee: 4.99 },
  { name: "Geisel", fee: 7.0 },
  { name: "Cuia", fee: 8.0 },
  { name: "Cabo Branco", fee: 12.0 },
  { name: "Centro", fee: 15.0 },
];

const ADDON_PRICES: Record<NonNullable<CartAddonSelection["beverageAddon"]>, number> = {
  FANTA: 0,
  PEPSI: 0,
  COCA_COLA: 4,
  GUARANA: 4,
};

const ADDON_LABELS: Record<NonNullable<CartAddonSelection["beverageAddon"]>, string> = {
  FANTA: "Fanta",
  PEPSI: "Pepsi",
  COCA_COLA: "Coca-Cola",
  GUARANA: "Guarana",
};

const normalizeAddons = (addons: CartAddonSelection): CartAddonSelection => ({
  beverageAddon: addons.beverageAddon,
  friesAddon: addons.friesAddon === true,
});

const getAddonsTotal = (addons: CartAddonSelection) =>
  (addons.beverageAddon ? ADDON_PRICES[addons.beverageAddon] : 0) + (addons.friesAddon ? 10 : 0);

const getAddonsSummary = (addons: CartAddonSelection) => {
  const summary = [];
  if (addons.beverageAddon) summary.push(`Refrigerante: ${ADDON_LABELS[addons.beverageAddon]}`);
  if (addons.friesAddon) summary.push("Batata frita");
  return summary.join("; ");
};

const getCartItemId = (productId: number, addons: CartAddonSelection) =>
  `${productId}:${addons.beverageAddon ?? "NO_DRINK"}:${addons.friesAddon ? "FRIES" : "NO_FRIES"}`;

interface CartContextData {
  cartItems: CartItem[];
  isCartOpen: boolean;
  deliveryNeighborhood: Neighborhood | null;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  setIsCartOpen: (isOpen: boolean) => void;
  addToCart: (product: Product, quantity?: number, addons?: CartAddonSelection) => void;
  removeFromCart: (itemId: string | number) => void;
  updateQuantity: (itemId: string | number, quantity: number) => void;
  setNeighborhood: (neighborhoodName: string) => void;
  clearCart: () => void;
  pendingPayment: PendingPayment | null;
  setPendingPayment: (payment: PendingPayment | null) => void;
  isStoreOpen: boolean;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryNeighborhood, setDeliveryNeighborhoodState] = useState<Neighborhood | null>(null);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  React.useEffect(() => {
    fetch("/api/v1/settings/store/status")
      .then((res) => res.json())
      .then((data) => setIsStoreOpen(data.isOpen))
      .catch((err) => console.error("Erro ao buscar status da loja:", err));
  }, []);

  const subtotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + (item.product.price + item.addonsTotal) * item.quantity, 0),
    [cartItems]
  );

  const deliveryFee = deliveryNeighborhood?.fee ?? 0;
  const totalAmount = subtotal + deliveryFee;

  const addToCart = (product: Product, quantity: number = 1, addons: CartAddonSelection = {}) => {
    const normalizedAddons = normalizeAddons(addons);
    const itemId = getCartItemId(product.id, normalizedAddons);
    const addonsTotal = getAddonsTotal(normalizedAddons);
    const addonsSummary = getAddonsSummary(normalizedAddons);

    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing) {
        return prev.map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { id: itemId, product, quantity, addons: normalizedAddons, addonsSummary, addonsTotal }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (itemId: string | number) => {
    setCartItems((prev) => prev.filter((i) => i.id !== String(itemId)));
  };

  const updateQuantity = (itemId: string | number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((i) => (i.id === String(itemId) ? { ...i, quantity } : i))
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
        pendingPayment,
        setPendingPayment,
        isStoreOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

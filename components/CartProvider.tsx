"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Product, CartItem } from "@/types";

/** Identity of a single cart line. Two colors of the same product are different
 *  lines, so the key includes colorKey. */
type LineKey = { productId: string; colorKey?: string };

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, color?: CartItem["color"]) => void;
  removeFromCart: (key: LineKey) => void;
  updateQuantity: (key: LineKey, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isHydrated: boolean;
}

const sameLine = (a: { id: string; color?: { key: string } }, b: LineKey) =>
  a.id === b.productId && (a.color?.key ?? undefined) === (b.colorKey ?? undefined);

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "zest:cart";

const sanitizeQuantity = (product: Product, requested: number) => {
  const max = product.stock > 0 ? product.stock : 0;
  if (max === 0) return 0;
  return Math.min(Math.max(1, requested), max);
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setCart(parsed);
      }
    } catch {}
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart, isHydrated]);

  // Clear the cart on logout (AuthProvider dispatches this) so a shared device
  // doesn't carry one user's cart over to the next.
  useEffect(() => {
    const onLogout = () => {
      setCart([]);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    };
    window.addEventListener("zest:logout", onLogout);
    return () => window.removeEventListener("zest:logout", onLogout);
  }, []);

  const addToCart = (product: Product, quantity = 1, color?: CartItem["color"]) => {
    if (product.stock <= 0) return;
    const key: LineKey = { productId: product.id, colorKey: color?.key };
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => sameLine(item, key));
      if (existingItem) {
        const next = sanitizeQuantity(product, existingItem.quantity + quantity);
        return prevCart.map((item) =>
          sameLine(item, key) ? { ...item, quantity: next } : item,
        );
      }
      const next = sanitizeQuantity(product, quantity);
      if (next === 0) return prevCart;
      return [...prevCart, { ...product, quantity: next, color }];
    });
  };

  const removeFromCart = (key: LineKey) => {
    setCart((prevCart) => prevCart.filter((item) => !sameLine(item, key)));
  };

  const updateQuantity = (key: LineKey, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(key);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        sameLine(item, key)
          ? { ...item, quantity: sanitizeQuantity(item, quantity) }
          : item,
      ),
    );
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isHydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

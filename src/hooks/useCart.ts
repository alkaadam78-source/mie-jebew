import { useState, useEffect, useMemo, useCallback } from 'react';
import { CartItem, MenuItem, SpiceLevel, Topping } from '../types';

const CART_STORAGE_KEY = 'mie_jebew_cart_v1';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse cart from localStorage', e);
    }
    return [];
  });

  // Persist to localStorage whenever cart changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cart]);

  const addToCart = useCallback(
    (
      menuItem: MenuItem,
      quantity: number,
      spiceLevel: SpiceLevel,
      selectedToppings: Topping[],
      notes: string
    ) => {
      if (quantity <= 0) return;

      // Unique cart item key based on configuration
      const sortedToppingIds = selectedToppings.map((t) => t.id).sort().join('-');
      const configKey = `${menuItem.id}-lvl${spiceLevel}-top[${sortedToppingIds}]-note[${notes.trim()}]`;

      setCart((prevCart) => {
        const existingIndex = prevCart.findIndex((item) => item.cartItemId === configKey);
        const toppingCost = selectedToppings.reduce((sum, t) => sum + t.price, 0);
        const singleItemPrice = menuItem.price + toppingCost;

        if (existingIndex > -1) {
          // Increment quantity
          const updated = [...prevCart];
          const newQty = updated[existingIndex].quantity + quantity;
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: newQty,
            itemTotal: singleItemPrice * newQty,
          };
          return updated;
        } else {
          // Add new item
          const newItem: CartItem = {
            cartItemId: configKey,
            menuItem,
            quantity,
            spiceLevel,
            selectedToppings: selectedToppings.map((t) => ({
              id: t.id,
              name: t.name,
              price: t.price,
            })),
            notes: notes.trim(),
            itemTotal: singleItemPrice * quantity,
          };
          return [...prevCart, newItem];
        }
      });
    },
    []
  );

  const updateQuantity = useCallback((cartItemId: string, newQty: number) => {
    setCart((prev) => {
      if (newQty <= 0) {
        return prev.filter((item) => item.cartItemId !== cartItemId);
      }
      return prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          const toppingCost = item.selectedToppings.reduce((sum, t) => sum + t.price, 0);
          const singleItemPrice = item.menuItem.price + toppingCost;
          return {
            ...item,
            quantity: newQty,
            itemTotal: singleItemPrice * newQty,
          };
        }
        return item;
      });
    });
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.itemTotal, 0);
  }, [cart]);

  return {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItems,
    totalAmount,
  };
}

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Product, CartItem, ProductVariant } from '@/types';
import { calculateDiscountedPrice } from '@/data/products';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

// Generate a unique key for a cart item based on product ID + variant
function cartItemKey(productId: string, variant?: ProductVariant): string {
  return variant ? `${productId}::${variant.name}` : productId;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  removeFromCart: (productId: string, variant?: ProductVariant) => void;
  updateQuantity: (productId: string, quantity: number, variant?: ProductVariant) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  isInCart: (productId: string, variant?: ProductVariant) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_KEY = 'peony-cart-guest';

function getGuestCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(GUEST_CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveGuestCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const isInitialized = useRef(false);
  const prevUserId = useRef<string | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------- Supabase helpers ----------

  const loadCartFromSupabase = useCallback(async (userId: string): Promise<CartItem[]> => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_cart')
        .select('product_id, variant_name, quantity, products(*)')
        .eq('user_id', userId);

      if (error || !data) return [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.filter((row: any) => row.products).map((row: any) => {
        const p = row.products;
        const product: Product = {
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          category: p.category,
          image: p.image,
          images: p.images || [],
          inStock: p.in_stock,
          featured: p.featured,
          discount_percentage: p.discount_percentage ?? null,
          specifications: p.specifications || undefined,
          variants: p.variants || undefined,
        };
        const variant = row.variant_name && product.variants
          ? product.variants.find((v: ProductVariant) => v.name === row.variant_name)
          : undefined;
        return { product, quantity: row.quantity, selectedVariant: variant } as CartItem;
      });
    } catch {
      return [];
    }
  }, []);

  const saveCartToSupabase = useCallback(async (userId: string, cartItems: CartItem[]) => {
    try {
      const supabase = createClient();
      // Clear existing cart then insert fresh
      await supabase.from('user_cart').delete().eq('user_id', userId);
      if (cartItems.length > 0) {
        const rows = cartItems.map(item => ({
          user_id: userId,
          product_id: item.product.id,
          variant_name: item.selectedVariant?.name ?? null,
          quantity: item.quantity,
        }));
        await supabase.from('user_cart').insert(rows);
      }
    } catch (err) {
      console.error('Failed to save cart to Supabase:', err);
    }
  }, []);

  // ---------- Auth-aware initialization ----------

  useEffect(() => {
    if (authLoading) return;

    const userId = user?.id ?? null;
    const previousUserId = prevUserId.current;

    // Same user — skip
    if (isInitialized.current && userId === previousUserId) return;

    const initialize = async () => {
      // If previous user was logged in and is now logging out, save their cart first
      if (previousUserId && !userId) {
        await saveCartToSupabase(previousUserId, items);
      }

      if (userId) {
        // User just logged in — load their server cart
        const serverCart = await loadCartFromSupabase(userId);
        
        // If there are guest items, merge them into the server cart
        const guestItems = getGuestCart();
        if (guestItems.length > 0) {
          const merged = [...serverCart];
          for (const guestItem of guestItems) {
            const key = cartItemKey(guestItem.product.id, guestItem.selectedVariant);
            const existing = merged.find(
              item => cartItemKey(item.product.id, item.selectedVariant) === key
            );
            if (!existing) {
              merged.push(guestItem);
            }
          }
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setItems(merged);
          // Clear guest cart after merge
          saveGuestCart([]);
          // Save merged cart to server
          await saveCartToSupabase(userId, merged);
        } else {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setItems(serverCart);
        }
      } else {
        // Guest — load from localStorage
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(getGuestCart());
      }

      prevUserId.current = userId;
      isInitialized.current = true;
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  // ---------- Persist on change ----------

  useEffect(() => {
    if (!isInitialized.current) return;

    if (user?.id) {
      // Debounce Supabase writes
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => {
        saveCartToSupabase(user.id, items);
      }, 500);
    } else {
      saveGuestCart(items);
    }
  }, [items, user?.id, saveCartToSupabase]);

  // ---------- Cart operations (unchanged) ----------

  const addToCart = useCallback((product: Product, quantity: number = 1, variant?: ProductVariant) => {
    setItems(currentItems => {
      const key = cartItemKey(product.id, variant);
      const existingItem = currentItems.find(
        item => cartItemKey(item.product.id, item.selectedVariant) === key
      );
      
      if (existingItem) {
        return currentItems.map(item =>
          cartItemKey(item.product.id, item.selectedVariant) === key
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...currentItems, { product, quantity, selectedVariant: variant }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string, variant?: ProductVariant) => {
    const key = cartItemKey(productId, variant);
    setItems(currentItems =>
      currentItems.filter(item => cartItemKey(item.product.id, item.selectedVariant) !== key)
    );
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, variant?: ProductVariant) => {
    if (quantity <= 0) {
      removeFromCart(productId, variant);
      return;
    }
    
    const key = cartItemKey(productId, variant);
    setItems(currentItems =>
      currentItems.map(item =>
        cartItemKey(item.product.id, item.selectedVariant) === key
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return items.reduce((total, item) => {
      const itemPrice = calculateDiscountedPrice(item.product.price, item.product.discount_percentage);
      return total + itemPrice * item.quantity;
    }, 0);
  }, [items]);

  const getCartCount = useCallback(() => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

  const isInCart = useCallback((productId: string, variant?: ProductVariant) => {
    const key = cartItemKey(productId, variant);
    return items.some(item => cartItemKey(item.product.id, item.selectedVariant) === key);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

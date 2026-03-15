'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Product } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface WishlistContextType {
  items: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  clearWishlist: () => void;
  getWishlistCount: () => number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const GUEST_WISHLIST_KEY = 'peony-wishlist-guest';

function getGuestWishlist(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(GUEST_WISHLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveGuestWishlist(items: Product[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const isInitialized = useRef(false);
  const prevUserId = useRef<string | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------- Supabase helpers ----------

  const loadWishlistFromSupabase = useCallback(async (userId: string): Promise<Product[]> => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_wishlist')
        .select('product_id, products(*)')
        .eq('user_id', userId);

      if (error || !data) return [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.filter((row: any) => row.products).map((row: any) => {
        const p = row.products;
        return {
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
        } as Product;
      });
    } catch {
      return [];
    }
  }, []);

  const saveWishlistToSupabase = useCallback(async (userId: string, wishlistItems: Product[]) => {
    try {
      const supabase = createClient();
      await supabase.from('user_wishlist').delete().eq('user_id', userId);
      if (wishlistItems.length > 0) {
        const rows = wishlistItems.map(item => ({
          user_id: userId,
          product_id: item.id,
        }));
        await supabase.from('user_wishlist').insert(rows);
      }
    } catch (err) {
      console.error('Failed to save wishlist to Supabase:', err);
    }
  }, []);

  // ---------- Auth-aware initialization ----------

  useEffect(() => {
    if (authLoading) return;

    const userId = user?.id ?? null;
    const previousUserId = prevUserId.current;

    if (isInitialized.current && userId === previousUserId) return;

    const initialize = async () => {
      // If previous user was logged in and is now logging out, save their wishlist first
      if (previousUserId && !userId) {
        await saveWishlistToSupabase(previousUserId, items);
      }

      if (userId) {
        // User logged in — load their server wishlist
        const serverWishlist = await loadWishlistFromSupabase(userId);

        // Merge guest items
        const guestItems = getGuestWishlist();
        if (guestItems.length > 0) {
          const merged = [...serverWishlist];
          for (const guestItem of guestItems) {
            if (!merged.some(item => item.id === guestItem.id)) {
              merged.push(guestItem);
            }
          }
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setItems(merged);
          saveGuestWishlist([]);
          await saveWishlistToSupabase(userId, merged);
        } else {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setItems(serverWishlist);
        }
      } else {
        // Guest — load from localStorage
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(getGuestWishlist());
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
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => {
        saveWishlistToSupabase(user.id, items);
      }, 500);
    } else {
      saveGuestWishlist(items);
    }
  }, [items, user?.id, saveWishlistToSupabase]);

  // ---------- Wishlist operations ----------

  const addToWishlist = useCallback((product: Product) => {
    setItems(currentItems => {
      if (currentItems.some(item => item.id === product.id)) {
        return currentItems;
      }
      return [...currentItems, product];
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== productId));
  }, []);

  const isInWishlist = useCallback((productId: string) => {
    return items.some(item => item.id === productId);
  }, [items]);

  const toggleWishlist = useCallback((product: Product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  }, [isInWishlist, removeFromWishlist, addToWishlist]);

  const clearWishlist = useCallback(() => {
    setItems([]);
  }, []);

  const getWishlistCount = useCallback(() => {
    return items.length;
  }, [items]);

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
        clearWishlist,
        getWishlistCount,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}

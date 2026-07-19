import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { CartItem, Product } from './types';
import { supabase } from './supabase';
import { CURRENCIES, getCurrency } from './format';

type Theme = 'light' | 'dark';

type Toast = { id: number; message: string; kind?: 'success' | 'error' | 'info' };

type SessionUser = { id: string; email: string } | null;

type StoreState = {
  theme: Theme;
  toggleTheme: () => void;
  currency: string;
  setCurrency: (code: string) => void;
  cart: CartItem[];
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  recentlyViewed: string[];
  pushRecent: (productId: string) => void;
  compare: string[];
  toggleCompare: (productId: string) => void;
  clearCompare: () => void;
  toasts: Toast[];
  toast: (message: string, kind?: Toast['kind']) => void;
  dismissToast: (id: number) => void;
  user: SessionUser;
  setUser: (u: SessionUser) => void;
};

const StoreContext = createContext<StoreState | null>(null);

function usePersistentState<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [key, state]);
  return [state, setState];
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('maison-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [currency, setCurrencyState] = useState<string>(() => localStorage.getItem('maison-currency') || 'USD');
  const [cart, setCart] = usePersistentState<CartItem[]>('maison-cart', []);
  const [wishlist, setWishlist] = usePersistentState<string[]>('maison-wishlist', []);
  const [recentlyViewed, setRecent] = usePersistentState<string[]>('maison-recent', []);
  const [compare, setCompare] = usePersistentState<string[]>('maison-compare', []);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [user, setUser] = useState<SessionUser>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('maison-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('maison-currency', currency);
  }, [currency]);

  // Restore session + listen for auth changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted && data.session) {
        setUser({ id: data.session.user.id, email: data.session.user.email ?? '' });
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session) setUser({ id: session.user.id, email: session.user.email ?? '' });
        else setUser(null);
      })();
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  const setCurrency = useCallback((code: string) => setCurrencyState(code), []);

  const toast = useCallback((message: string, kind: Toast['kind'] = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const addToCart = useCallback(
    (product: Product, qty = 1) => {
      setCart((prev) => {
        const existing = prev.find((i) => i.product_id === product.id);
        const max = Math.max(1, product.stock || 12);
        if (existing) {
          return prev.map((i) =>
            i.product_id === product.id ? { ...i, qty: Math.min(max, i.qty + qty) } : i,
          );
        }
        return [
          ...prev,
          {
            product_id: product.id,
            slug: product.slug,
            name: product.name,
            price_cents: product.price_cents,
            image: product.primary_image,
            qty: Math.min(max, qty),
            stock: product.stock,
            max,
          },
        ];
      });
      toast(`${product.name} added to cart`);
    },
    [setCart, toast],
  );

  const removeFromCart = useCallback(
    (productId: string) => setCart((prev) => prev.filter((i) => i.product_id !== productId)),
    [setCart],
  );
  const setQty = useCallback(
    (productId: string, qty: number) =>
      setCart((prev) =>
        prev.map((i) =>
          i.product_id === productId ? { ...i, qty: Math.max(1, Math.min(i.max, qty)) } : i,
        ),
      ),
    [setCart],
  );
  const clearCart = useCallback(() => setCart([]), [setCart]);

  const toggleWishlist = useCallback(
    (productId: string) => {
      setWishlist((prev) => {
        if (prev.includes(productId)) {
          toast('Removed from wishlist', 'info');
          return prev.filter((id) => id !== productId);
        }
        toast('Saved to wishlist');
        return [productId, ...prev];
      });
      // persist to DB if logged in
      (async () => {
        const { data: s } = await supabase.auth.getSession();
        if (!s.session) return;
        const exists = wishlist.includes(productId);
        if (exists) {
          await supabase.from('wishlists').delete().eq('product_id', productId);
        } else {
          await supabase.from('wishlists').insert({ product_id: productId }).eq('user_id', s.session.user.id);
        }
      })();
    },
    [setWishlist, toast, wishlist],
  );
  const isWishlisted = useCallback((productId: string) => wishlist.includes(productId), [wishlist]);

  const pushRecent = useCallback(
    (productId: string) => {
      setRecent((prev) => [productId, ...prev.filter((id) => id !== productId)].slice(0, 12));
    },
    [setRecent],
  );

  const toggleCompare = useCallback(
    (productId: string) => {
      setCompare((prev) => {
        if (prev.includes(productId)) return prev.filter((id) => id !== productId);
        if (prev.length >= 4) {
          toast('You can compare up to 4 products', 'info');
          return prev;
        }
        toast('Added to comparison');
        return [...prev, productId];
      });
    },
    [setCompare, toast],
  );
  const clearCompare = useCallback(() => setCompare([]), [setCompare]);

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);
  const cartSubtotal = useMemo(() => cart.reduce((s, i) => s + i.price_cents * i.qty, 0), [cart]);

  const value: StoreState = {
    theme,
    toggleTheme,
    currency,
    setCurrency,
    cart,
    addToCart,
    removeFromCart,
    setQty,
    clearCart,
    cartCount,
    cartSubtotal,
    wishlist,
    toggleWishlist,
    isWishlisted,
    recentlyViewed,
    pushRecent,
    compare,
    toggleCompare,
    clearCompare,
    toasts,
    toast,
    dismissToast,
    user,
    setUser,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreState {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export { CURRENCIES, getCurrency };

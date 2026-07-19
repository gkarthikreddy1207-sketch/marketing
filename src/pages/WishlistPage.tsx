import { useEffect, useState } from 'react';
import { Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import type { Product } from '../lib/types';
import { fetchProducts } from '../lib/api';
import { ProductCard } from '../components/ProductCard';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { navigate } from '../lib/router';

export function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart, recentlyViewed, toast } = useStore();
  const [items, setItems] = useState<Product[]>([]);
  const [recent, setRecent] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      if (wishlist.length) {
        const r = await fetchProducts({ ids: wishlist, limit: 50 });
        if (active) setItems(r.items);
      } else setItems([]);
      if (recentlyViewed.length) {
        const rr = await fetchProducts({ ids: recentlyViewed.slice(0, 8), limit: 8 });
        if (active) setRecent(rr.items);
      } else setRecent([]);
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [wishlist, recentlyViewed]);

  const addAll = () => {
    items.forEach((p) => { if (p.stock > 0) addToCart(p); });
    toast('Added available items to cart');
  };

  return (
    <div className="container-page py-8 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Wishlist' }]} />
      <div className="mt-4 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">Your wishlist</h1>
          <p className="mt-1 text-sm text-ink-500">{loading ? 'Loading…' : `${items.length} saved items`}</p>
        </div>
        {items.length > 0 && (
          <button onClick={addAll} className="btn-primary"><ShoppingBag size={16} /> Add all to cart</button>
        )}
      </div>

      {loading ? (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[3/4] skeleton rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-ink-300 py-20 text-center dark:border-ink-700">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ink-100 dark:bg-ink-800">
            <Heart size={32} className="text-ink-400" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold">No saved items yet</p>
            <p className="mt-1 text-sm text-ink-500">Tap the heart on any product to save it here.</p>
          </div>
          <button onClick={() => navigate('/shop')} className="btn-primary">Discover products <ArrowRight size={16} /></button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p, i) => (
            <div key={p.id} className="relative">
              <ProductCard product={p} index={i} />
              <button onClick={() => toggleWishlist(p.id)} aria-label="Remove from wishlist" className="absolute right-3 top-[60%] z-10 flex h-9 w-9 items-center justify-center rounded-full bg-rose-500 text-white shadow-soft hover:bg-rose-600">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* recently viewed */}
      {recent.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold">Recently viewed</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {recent.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}

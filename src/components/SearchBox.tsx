import { useEffect, useRef, useState } from 'react';
import { Search, X, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product } from '../lib/types';
import { formatPrice, classNames } from '../lib/format';
import { useStore } from '../lib/store';
import { navigate } from '../lib/router';

export function SearchBox({ onClose }: { onClose?: () => void }) {
  const { currency } = useStore();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${term}%,subtitle.ilike.%${term}%,brand.ilike.%${term}%`)
        .limit(6);
      setResults((data ?? []) as Product[]);
      setLoading(false);
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    navigate(`/shop?search=${encodeURIComponent(term)}`);
    setOpen(false);
    onClose?.();
  };

  return (
    <div ref={boxRef} className="relative w-full">
      <form onSubmit={submit} role="search">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search products, brands, categories…"
            aria-label="Search products"
            className="input pl-11 pr-10"
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ('');
                setResults([]);
              }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </form>

      {open && (q.length >= 2 || results.length > 0) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl border border-ink-200 bg-white p-2 shadow-card animate-scale-in dark:border-ink-800 dark:bg-ink-900">
          {loading && <div className="p-4 text-sm text-ink-400">Searching…</div>}
          {!loading && results.length === 0 && q.length >= 2 && (
            <div className="p-4 text-sm text-ink-400">No products match “{q}”.</div>
          )}
          {!loading && results.length > 0 && (
            <ul className="divide-y divide-ink-100 dark:divide-ink-800">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => {
                      navigate(`/product/${p.slug}`);
                      setOpen(false);
                      onClose?.();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-ink-50 dark:hover:bg-ink-800"
                  >
                    <img src={p.primary_image ?? ''} alt={p.name} className="h-12 w-12 rounded-lg object-cover" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium text-ink-900 dark:text-ink-100">{p.name}</p>
                      <p className="text-xs text-ink-400">{p.brand}</p>
                    </div>
                    <span className="text-sm font-semibold text-ink-900 dark:text-ink-50">{formatPrice(p.price_cents, currency)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={submit}
            className={classNames(
              'mt-1 flex w-full items-center justify-center gap-2 rounded-xl p-2.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/30',
            )}
          >
            <TrendingUp size={15} /> View all results
          </button>
        </div>
      )}
    </div>
  );
}

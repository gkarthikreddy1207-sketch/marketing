import { useEffect, useState } from 'react';
import { GitCompare, X, Check, ArrowRight } from 'lucide-react';
import { useStore } from '../lib/store';
import { fetchProducts } from '../lib/api';
import type { Product } from '../lib/types';
import { formatPrice, discountPercent, classNames } from '../lib/format';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { StarRating } from '../components/StarRating';
import { navigate } from '../lib/router';

export function ComparePage() {
  const { compare, toggleCompare, clearCompare, currency } = useStore();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      if (compare.length) {
        const r = await fetchProducts({ ids: compare, limit: 4 });
        if (active) setItems(r.items);
      } else setItems([]);
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [compare]);

  const allSpecKeys = Array.from(new Set(items.flatMap((p) => Object.keys(p.specs))));

  if (compare.length === 0 && !loading) {
    return (
      <div className="container-page py-16 animate-fade-in">
        <Breadcrumbs items={[{ label: 'Compare' }]} />
        <div className="mt-10 flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-ink-300 py-20 text-center dark:border-ink-700">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ink-100 dark:bg-ink-800">
            <GitCompare size={32} className="text-ink-400" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold">Nothing to compare yet</p>
            <p className="mt-1 text-sm text-ink-500">Add up to 4 products to compare them side by side.</p>
          </div>
          <button onClick={() => navigate('/shop')} className="btn-primary">Browse products <ArrowRight size={16} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-8 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Compare' }]} />
      <div className="mt-4 flex items-end justify-between">
        <h1 className="font-display text-3xl font-semibold md:text-4xl">Compare products</h1>
        <button onClick={clearCompare} className="btn-ghost text-sm">Clear all</button>
      </div>

      {loading ? (
        <div className="mt-8 skeleton h-96 rounded-2xl" />
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-40 p-4 text-left text-sm font-medium text-ink-500"></th>
                {items.map((p) => (
                  <th key={p.id} className="p-4 align-top">
                    <div className="relative">
                      <button onClick={() => toggleCompare(p.id)} aria-label="Remove" className="absolute -right-1 -top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-ink-100 text-ink-500 hover:bg-rose-100 hover:text-rose-600 dark:bg-ink-800">
                        <X size={14} />
                      </button>
                      <button onClick={() => navigate(`/product/${p.slug}`)} className="block w-full overflow-hidden rounded-2xl">
                        <img src={p.primary_image ?? ''} alt={p.name} className="aspect-square w-full rounded-2xl object-cover" loading="lazy" />
                      </button>
                      <button onClick={() => navigate(`/product/${p.slug}`)} className="mt-3 block text-left font-display text-base font-semibold hover:text-brand-700">{p.name}</button>
                      <p className="text-xs text-ink-400">{p.brand}</p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              <CompareRow label="Price" cells={items.map((p) => <span className="font-display text-lg font-bold">{formatPrice(p.price_cents, currency)}</span>)} />
              <CompareRow label="Compare at" cells={items.map((p) => p.compare_at_cents ? <span className="text-ink-400 line-through">{formatPrice(p.compare_at_cents, currency)}</span> : <span className="text-ink-300">—</span>)} />
              <CompareRow label="Discount" cells={items.map((p) => { const d = discountPercent(p.price_cents, p.compare_at_cents); return d > 0 ? <span className="badge-sale">-{d}%</span> : <span className="text-ink-300">—</span>; })} />
              <CompareRow label="Rating" cells={items.map((p) => <StarRating rating={Number(p.rating)} showValue />)} />
              <CompareRow label="Reviews" cells={items.map((p) => <span>{p.reviews_count}</span>)} />
              <CompareRow label="Stock" cells={items.map((p) => p.stock > 0 ? <span className="inline-flex items-center gap-1 text-brand-700"><Check size={15} /> In stock</span> : <span className="text-rose-600">Out</span>)} />
              <CompareRow label="Brand" cells={items.map((p) => <span>{p.brand}</span>)} />
              <CompareRow label="SKU" cells={items.map((p) => <span className="text-ink-500">{p.sku}</span>)} />
              {allSpecKeys.map((k) => (
                <CompareRow key={k} label={k} cells={items.map((p) => <span className="text-ink-600 dark:text-ink-300">{p.specs[k] ?? '—'}</span>)} />
              ))}
              <CompareRow label="" cells={items.map((p) => <button onClick={() => navigate(`/product/${p.slug}`)} className="btn-outline w-full">View</button>)} last />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CompareRow({ label, cells, last }: { label: string; cells: React.ReactNode[]; last?: boolean }) {
  return (
    <tr className={classNames(!last && 'border-b border-ink-100 dark:border-ink-800')}>
      <td className="p-4 text-sm font-medium text-ink-500">{label}</td>
      {cells.map((c, i) => <td key={i} className="p-4">{c}</td>)}
    </tr>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal, X, ChevronDown, Search, PackageX } from 'lucide-react';
import { fetchProducts, fetchProductsByCategorySlug, fetchCategories } from '../lib/api';
import type { Category, Product } from '../lib/types';
import { ProductCard } from '../components/ProductCard';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useStore } from '../lib/store';
import { useRouter, navigate } from '../lib/router';
import { classNames } from '../lib/format';

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
];

const PRICE_BANDS = [
  { label: 'Under $25', min: 0, max: 2500 },
  { label: '$25 – $75', min: 2500, max: 7500 },
  { label: '$75 – $200', min: 7500, max: 20000 },
  { label: '$200 – $500', min: 20000, max: 50000 },
  { label: '$500+', min: 50000, max: 99999999 },
];

export function ShopPage() {
  const { route } = useRouter();
  const { compare, clearCompare, toggleCompare } = useStore();
  const categorySlug = route.query.category;
  const search = route.query.search;
  const sortParam = route.query.sort;
  const filterParam = route.query.filter;

  const [cats, setCats] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(sortParam || 'featured');
  const [priceBand, setPriceBand] = useState<number | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState(search || '');
  const limit = 12;

  useEffect(() => { fetchCategories().then(setCats).catch(() => {}); }, []);

  useEffect(() => {
    setPage(1);
    setSort(sortParam || 'featured');
    setLocalSearch(search || '');
  }, [categorySlug, search, sortParam]);

  const activeCat = useMemo(() => cats.find((c) => c.slug === categorySlug) ?? null, [cats, categorySlug]);
  const topCats = useMemo(() => cats.filter((c) => !c.parent_id), [cats]);

  const brands = useMemo(() => {
    const set = new Set(products.map((p) => p.brand).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [products]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const opts: Parameters<typeof fetchProducts>[0] = {
          search: search || undefined,
          sort,
          limit,
          page,
          minPrice: priceBand !== null ? PRICE_BANDS[priceBand].min : undefined,
          maxPrice: priceBand !== null ? PRICE_BANDS[priceBand].max : undefined,
          brand: brand ?? undefined,
        };
        if (filterParam === 'best') opts.bestSeller = true;
        if (filterParam === 'trending') opts.trending = true;
        if (filterParam === 'deals') opts.maxPrice = undefined; // deals handled client side below
        let res;
        if (categorySlug) res = await fetchProductsByCategorySlug(categorySlug, opts);
        else res = await fetchProducts(opts);
        if (!active) return;
        let items = res.items;
        if (filterParam === 'deals') items = items.filter((p) => p.compare_at_cents && p.compare_at_cents > p.price_cents);
        setProducts(items);
        setTotal(res.total);
      } catch {
        setProducts([]);
        setTotal(0);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [categorySlug, search, sort, page, priceBand, brand, filterParam]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const title = search ? `Results for "${search}"` : activeCat ? activeCat.name : filterParam === 'best' ? 'Best sellers' : filterParam === 'trending' ? 'Trending' : filterParam === 'deals' ? 'Deals & savings' : 'All products';

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = localSearch.trim();
    navigate(q ? `/shop?search=${encodeURIComponent(q)}` : '/shop');
  };

  const FilterPanel = (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink-900 dark:text-ink-100">Categories</h3>
        <ul className="space-y-1.5">
          <li>
            <button onClick={() => navigate('/shop')} className={classNames('block w-full rounded-lg px-3 py-1.5 text-left text-sm hover:bg-ink-100 dark:hover:bg-ink-800', !categorySlug && 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300')}>
              All products
            </button>
          </li>
          {topCats.map((c) => (
            <li key={c.id}>
              <button onClick={() => navigate(`/shop?category=${c.slug}`)} className={classNames('block w-full rounded-lg px-3 py-1.5 text-left text-sm hover:bg-ink-100 dark:hover:bg-ink-800', categorySlug === c.slug && 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300')}>
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink-900 dark:text-ink-100">Price</h3>
        <ul className="space-y-1.5">
          {PRICE_BANDS.map((b, i) => (
            <li key={b.label}>
              <button onClick={() => setPriceBand(priceBand === i ? null : i)} className={classNames('flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm hover:bg-ink-100 dark:hover:bg-ink-800', priceBand === i && 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300')}>
                <span className={classNames('flex h-4 w-4 items-center justify-center rounded-full border', priceBand === i ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-300 dark:border-ink-600')}>
                  {priceBand === i && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                {b.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {brands.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-ink-900 dark:text-ink-100">Brand</h3>
          <ul className="space-y-1.5">
            {brands.map((b) => (
              <li key={b}>
                <button onClick={() => setBrand(brand === b ? null : b)} className={classNames('block w-full rounded-lg px-3 py-1.5 text-left text-sm hover:bg-ink-100 dark:hover:bg-ink-800', brand === b && 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300')}>
                  {b}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(priceBand !== null || brand) && (
        <button onClick={() => { setPriceBand(null); setBrand(null); }} className="btn-ghost w-full text-sm">Clear filters</button>
      )}
    </div>
  );

  return (
    <div className="container-page py-8 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Shop', to: '/shop' }, ...(activeCat ? [{ label: activeCat.name }] : [])]} />

      <div className="mt-4 flex flex-col gap-2 border-b border-ink-200 pb-4 dark:border-ink-800 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">{title}</h1>
          <p className="mt-1 text-sm text-ink-500">{loading ? 'Loading…' : `${total} products`}</p>
        </div>
        <div className="flex items-center gap-2">
          <form onSubmit={submitSearch} className="relative hidden sm:block">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Search…" className="input w-48 pl-9" aria-label="Search within shop" />
          </form>
          <button onClick={() => setShowFilters(true)} className="btn-outline md:hidden">
            <SlidersHorizontal size={15} /> Filters
          </button>
          <div className="relative">
            <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} aria-label="Sort by" className="input w-44 cursor-pointer appearance-none pr-8">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">{FilterPanel}</div>
        </aside>

        <div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/4] skeleton rounded-2xl" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-ink-300 py-20 text-center dark:border-ink-700">
              <PackageX size={40} className="text-ink-400" />
              <div>
                <p className="font-display text-lg font-semibold">No products found</p>
                <p className="mt-1 text-sm text-ink-500">Try adjusting your filters or search.</p>
              </div>
              <button onClick={() => navigate('/shop')} className="btn-outline">Clear all</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  aria-label={`Page ${i + 1}`}
                  className={classNames('h-9 min-w-9 rounded-full px-3 text-sm font-medium transition-colors', page === i + 1 ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800')}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* compare bar */}
      {compare.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-[80] mx-auto w-fit max-w-[92vw]">
          <div className="flex items-center gap-3 rounded-full border border-ink-200 bg-white px-4 py-2.5 shadow-lift dark:border-ink-800 dark:bg-ink-900">
            <span className="text-sm font-medium">{compare.length} selected to compare</span>
            <button onClick={() => navigate('/compare')} className="btn-primary !py-1.5 !text-xs">Compare now</button>
            <button onClick={clearCompare} className="text-xs text-ink-500 hover:text-ink-900">Clear</button>
          </div>
        </div>
      )}

      {/* mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-white p-4 shadow-lift dark:bg-ink-950">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-semibold">Filters</span>
              <button onClick={() => setShowFilters(false)} aria-label="Close"><X size={22} /></button>
            </div>
            <div className="mt-4">{FilterPanel}</div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Ticket, Star, Image as ImageIcon,
  Plus, Search, Trash2, Pencil, X, TrendingUp, DollarSign, Eye, ArrowUpRight, ArrowDownRight, Check, Ban,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product, Order, Coupon, Review } from '../lib/types';
import { useStore } from '../lib/store';
import { useRouter, navigate } from '../lib/router';
import { formatPrice, formatDate, classNames } from '../lib/format';

type AdminTab = 'dashboard' | 'products' | 'orders' | 'customers' | 'coupons' | 'reviews' | 'banners';

export function AdminPage() {
  const { route } = useRouter();
  const { user } = useStore();
  const [tab, setTab] = useState<AdminTab>((route.query.tab as AdminTab) || 'dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<(Order & { order_items?: any[] })[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [p, o, c, r] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(100),
      supabase.from('coupons').select('*').order('created_at', { ascending: false }),
      supabase.from('reviews').select('*, products(name)').order('created_at', { ascending: false }).limit(50),
    ]);
    setProducts((p.data ?? []) as Product[]);
    setOrders((o.data ?? []) as (Order & { order_items?: any[] })[]);
    setCoupons((c.data ?? []) as Coupon[]);
    setReviews((r.data ?? []) as Review[]);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (route.query.tab) setTab(route.query.tab as AdminTab); }, [route.query.tab]);

  const nav: { id: AdminTab; label: string; icon: LucideIcon }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'coupons', label: 'Coupons', icon: Ticket },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'banners', label: 'Banners', icon: ImageIcon },
  ];

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <div className="container-page py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 font-display text-lg font-bold text-white dark:bg-white dark:text-ink-900">M</span>
            <div>
              <h1 className="font-display text-xl font-semibold">Maison Admin</h1>
              <p className="text-xs text-ink-400">{user ? user.email : 'Demo mode'}</p>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="btn-ghost text-sm">← Back to store</button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="lg:sticky lg:top-6 lg:h-fit">
            <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-ink-200 bg-white p-2 dark:border-ink-800 dark:bg-ink-900 lg:flex-col">
              {nav.map((n) => (
                <button
                  key={n.id}
                  onClick={() => { setTab(n.id); navigate(`/admin?tab=${n.id}`); }}
                  className={classNames('flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-colors', tab === n.id ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800')}
                >
                  <n.icon size={17} /> {n.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="min-w-0">
            {loading ? (
              <div className="skeleton h-96 rounded-2xl" />
            ) : (
              <>
                {tab === 'dashboard' && <DashboardView products={products} orders={orders} coupons={coupons} />}
                {tab === 'products' && <ProductsView products={products} onChange={loadData} />}
                {tab === 'orders' && <OrdersView orders={orders} />}
                {tab === 'customers' && <CustomersView orders={orders} />}
                {tab === 'coupons' && <CouponsView coupons={coupons} onChange={loadData} />}
                {tab === 'reviews' && <ReviewsView reviews={reviews} onChange={loadData} />}
                {tab === 'banners' && <BannersView />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Dashboard ----------
function DashboardView({ products, orders, coupons }: { products: Product[]; orders: (Order & { order_items?: any[] })[]; coupons: Coupon[] }) {
  const { currency } = useStore();
  const revenue = orders.reduce((s, o) => s + o.total_cents, 0);
  const avgOrder = orders.length ? revenue / orders.length : 0;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5);
  const outStock = products.filter((p) => p.stock === 0);

  // simple 7-day revenue sparkline from orders
  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0, 0, 0, 0);
    const next = new Date(d); next.setDate(d.getDate() + 1);
    const dayRev = orders.filter((o) => { const t = new Date(o.created_at); return t >= d && t < next; }).reduce((s, o) => s + o.total_cents, 0);
    return { label: d.toLocaleDateString('en-US', { weekday: 'short' }), value: dayRev };
  });
  const maxRev = Math.max(1, ...last7.map((d) => d.value));

  // top products by reviews count
  const topProducts = [...products].sort((a, b) => b.reviews_count - a.reviews_count).slice(0, 5);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-semibold">Overview</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Revenue" value={formatPrice(revenue, currency)} icon={DollarSign} trend="+12.4%" up />
        <MetricCard label="Orders" value={String(orders.length)} icon={ShoppingCart} trend="+8.1%" up />
        <MetricCard label="Avg order" value={formatPrice(avgOrder, currency)} icon={TrendingUp} trend="+3.2%" up />
        <MetricCard label="Products" value={String(products.length)} icon={Package} trend={`${outStock.length} out`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-ink-200 bg-white p-6 dark:border-ink-800 dark:bg-ink-900 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Revenue · last 7 days</h3>
            <span className="text-sm text-ink-400">{formatPrice(revenue, currency)} total</span>
          </div>
          <div className="mt-6 flex items-end justify-between gap-3 h-44">
            {last7.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-400 transition-all" style={{ height: `${(d.value / maxRev) * 100}%`, minHeight: '4px' }} title={formatPrice(d.value, currency)} />
                </div>
                <span className="text-xs text-ink-400">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-6 dark:border-ink-800 dark:bg-ink-900">
          <h3 className="font-display text-lg font-semibold">Inventory alerts</h3>
          <div className="mt-4 space-y-3">
            {lowStock.length === 0 && outStock.length === 0 && <p className="text-sm text-ink-400">All products well stocked.</p>}
            {lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="line-clamp-1">{p.name}</span>
                <span className="chip bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300">{p.stock} left</span>
              </div>
            ))}
            {outStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="line-clamp-1">{p.name}</span>
                <span className="chip bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">Out</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink-200 bg-white p-6 dark:border-ink-800 dark:bg-ink-900">
          <h3 className="font-display text-lg font-semibold">Top products</h3>
          <ul className="mt-4 space-y-3">
            {topProducts.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-100 text-xs font-bold text-ink-600 dark:bg-ink-800">{i + 1}</span>
                <img src={p.primary_image ?? ''} alt="" className="h-10 w-10 rounded-lg object-cover" loading="lazy" />
                <span className="flex-1 line-clamp-1 text-sm font-medium">{p.name}</span>
                <span className="text-sm text-ink-400">{p.reviews_count} reviews</span>
                <span className="text-sm font-semibold">{formatPrice(p.price_cents, currency)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-ink-200 bg-white p-6 dark:border-ink-800 dark:bg-ink-900">
          <h3 className="font-display text-lg font-semibold">Recent orders</h3>
          <ul className="mt-4 space-y-3">
            {orders.slice(0, 5).map((o) => (
              <li key={o.id} className="flex items-center justify-between text-sm">
                <div><p className="font-medium">{o.order_number}</p><p className="text-xs text-ink-400">{formatDate(o.created_at)}</p></div>
                <span className="font-semibold">{formatPrice(o.total_cents, currency)}</span>
              </li>
            ))}
            {orders.length === 0 && <p className="text-sm text-ink-400">No orders yet.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, trend, up }: { label: string; value: string; icon: LucideIcon; trend?: string; up?: boolean }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400"><Icon size={18} /></div>
        {trend && (
          <span className={classNames('flex items-center gap-1 text-xs font-medium', up ? 'text-brand-600' : 'text-ink-400')}>
            {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />} {trend}
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-2xl font-bold">{value}</p>
      <p className="text-sm text-ink-500">{label}</p>
    </div>
  );
}

// ---------- Products ----------
function ProductsView({ products, onChange }: { products: Product[]; onChange: () => void }) {
  const { currency } = useStore();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || (p.brand ?? '').toLowerCase().includes(q.toLowerCase()));

  const remove = async (p: Product) => {
    if (!confirm(`Delete ${p.name}? This cannot be undone.`)) return;
    await supabase.from('products').delete().eq('id', p.id);
    onChange();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">Products ({products.length})</h2>
        <button onClick={() => setCreating(true)} className="btn-primary"><Plus size={16} /> Add product</button>
      </div>
      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="input pl-9" />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-100 text-left text-ink-500 dark:border-ink-800">
            <tr>
              <th className="p-4 font-medium">Product</th>
              <th className="p-4 font-medium">Brand</th>
              <th className="p-4 font-medium">Price</th>
              <th className="p-4 font-medium">Stock</th>
              <th className="p-4 font-medium">Rating</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-ink-50 dark:hover:bg-ink-800/50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img src={p.primary_image ?? ''} alt="" className="h-10 w-10 rounded-lg object-cover" loading="lazy" />
                    <span className="line-clamp-1 font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="p-4 text-ink-500">{p.brand}</td>
                <td className="p-4 font-medium">{formatPrice(p.price_cents, currency)}</td>
                <td className="p-4">
                  <span className={classNames('chip', p.stock === 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' : p.stock <= 5 ? 'bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300' : 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300')}>{p.stock}</span>
                </td>
                <td className="p-4 text-ink-500">{Number(p.rating).toFixed(1)} ({p.reviews_count})</td>
                <td className="p-4">
                  <div className="flex gap-1">
                    <button onClick={() => navigate(`/product/${p.slug}`)} aria-label="View" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800"><Eye size={15} /></button>
                    <button onClick={() => setEditing(p)} aria-label="Edit" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800"><Pencil size={15} /></button>
                    <button onClick={() => remove(p)} aria-label="Delete" className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(editing || creating) && (
        <ProductModal
          product={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); onChange(); }}
        />
      )}
    </div>
  );
}

function ProductModal({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useStore();
  const [form, setForm] = useState({
    name: product?.name ?? '',
    slug: product?.slug ?? '',
    subtitle: product?.subtitle ?? '',
    description: product?.description ?? '',
    brand: product?.brand ?? '',
    price_cents: product ? String(product.price_cents) : '',
    compare_at_cents: product?.compare_at_cents ? String(product.compare_at_cents) : '',
    stock: product ? String(product.stock) : '0',
    primary_image: product?.primary_image ?? '',
    is_featured: product?.is_featured ?? false,
    is_trending: product?.is_trending ?? false,
    is_best_seller: product?.is_best_seller ?? false,
    is_new_arrival: product?.is_new_arrival ?? false,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const payload = {
      name: form.name,
      slug,
      subtitle: form.subtitle || null,
      description: form.description || null,
      brand: form.brand || null,
      price_cents: Number(form.price_cents) || 0,
      compare_at_cents: form.compare_at_cents ? Number(form.compare_at_cents) : null,
      stock: Number(form.stock) || 0,
      primary_image: form.primary_image || null,
      specs: product?.specs ?? {},
      is_featured: form.is_featured,
      is_trending: form.is_trending,
      is_best_seller: form.is_best_seller,
      is_new_arrival: form.is_new_arrival,
    };
    try {
      if (product) {
        const { error } = await supabase.from('products').update(payload).eq('id', product.id);
        if (error) throw error;
        toast('Product updated');
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
        toast('Product created');
      }
      onSaved();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-ink-200 bg-white p-6 shadow-lift animate-scale-in dark:border-ink-800 dark:bg-ink-900">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">{product ? 'Edit product' : 'New product'}</h3>
          <button onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field2 label="Name"><input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field2>
          <Field2 label="Brand"><input className="input" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} /></Field2>
          <div className="sm:col-span-2"><Field2 label="Subtitle"><input className="input" value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} /></Field2></div>
          <div className="sm:col-span-2"><Field2 label="Description"><textarea className="input min-h-20" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field2></div>
          <Field2 label="Price (cents)"><input type="number" className="input" value={form.price_cents} onChange={(e) => setForm((f) => ({ ...f, price_cents: e.target.value }))} /></Field2>
          <Field2 label="Compare at (cents)"><input type="number" className="input" value={form.compare_at_cents} onChange={(e) => setForm((f) => ({ ...f, compare_at_cents: e.target.value }))} /></Field2>
          <Field2 label="Stock"><input type="number" className="input" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} /></Field2>
          <Field2 label="Image URL"><input className="input" value={form.primary_image} onChange={(e) => setForm((f) => ({ ...f, primary_image: e.target.value }))} /></Field2>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {([['is_featured', 'Featured'], ['is_trending', 'Trending'], ['is_best_seller', 'Best seller'], ['is_new_arrival', 'New']] as const).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 rounded-xl border border-ink-200 p-2.5 text-sm dark:border-ink-700">
              <input type="checkbox" checked={form[k] as boolean} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.checked }))} />
              {label}
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="btn-outline">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

function Field2({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}

// ---------- Orders ----------
function OrdersView({ orders }: { orders: (Order & { order_items?: any[] })[] }) {
  const { currency } = useStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const statuses = ['all', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
  const filtered = orders.filter((o) => statusFilter === 'all' || o.status === statusFilter);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    setOrdersState(orders.map((o) => o.id === id ? { ...o, status: status as any } : o));
  };
  const [ordersState, setOrdersState] = useState(orders);
  useEffect(() => { setOrdersState(orders); }, [orders]);

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold">Orders ({orders.length})</h2>
      <div className="flex gap-1 overflow-x-auto">
        {statuses.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={classNames('chip shrink-0 border', statusFilter === s ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300')}>{s}</button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-100 text-left text-ink-500 dark:border-ink-800">
            <tr><th className="p-4 font-medium">Order</th><th className="p-4 font-medium">Customer</th><th className="p-4 font-medium">Date</th><th className="p-4 font-medium">Total</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium">Update</th></tr>
          </thead>
          <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
            {filtered.map((o) => (
              <tr key={o.id} className="hover:bg-ink-50 dark:hover:bg-ink-800/50">
                <td className="p-4 font-medium">{o.order_number}</td>
                <td className="p-4 text-ink-500">{o.shipping_name ?? '—'}</td>
                <td className="p-4 text-ink-500">{formatDate(o.created_at)}</td>
                <td className="p-4 font-semibold">{formatPrice(o.total_cents, currency)}</td>
                <td className="p-4"><span className="chip bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">{o.status}</span></td>
                <td className="p-4">
                  <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className="input !py-1.5 !text-xs">
                    {statuses.filter((s) => s !== 'all').map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-ink-400">No orders in this status.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Customers ----------
function CustomersView({ orders }: { orders: (Order & { order_items?: any[] })[] }) {
  const { currency } = useStore();
  const customers = useMemo(() => {
    const map = new Map<string, { name: string; email?: string; orders: number; spent: number }>();
    orders.forEach((o) => {
      const name = o.shipping_name ?? 'Guest';
      const existing = map.get(name) ?? { name, orders: 0, spent: 0 };
      existing.orders += 1; existing.spent += o.total_cents;
      map.set(name, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.spent - a.spent);
  }, [orders]);

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold">Customers ({customers.length})</h2>
      <div className="overflow-x-auto rounded-2xl border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-100 text-left text-ink-500 dark:border-ink-800">
            <tr><th className="p-4 font-medium">Customer</th><th className="p-4 font-medium">Orders</th><th className="p-4 font-medium">Total spent</th><th className="p-4 font-medium">Avg order</th></tr>
          </thead>
          <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
            {customers.map((c) => (
              <tr key={c.name} className="hover:bg-ink-50 dark:hover:bg-ink-800/50">
                <td className="p-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">{c.name.charAt(0)}</div><span className="font-medium">{c.name}</span></div></td>
                <td className="p-4 text-ink-500">{c.orders}</td>
                <td className="p-4 font-semibold">{formatPrice(c.spent, currency)}</td>
                <td className="p-4 text-ink-500">{formatPrice(c.orders ? c.spent / c.orders : 0, currency)}</td>
              </tr>
            ))}
            {customers.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-ink-400">No customers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Coupons ----------
function CouponsView({ coupons, onChange }: { coupons: Coupon[]; onChange: () => void }) {
  const { toast } = useStore();
  const [form, setForm] = useState({ code: '', description: '', kind: 'percent', value: '10', min_subtotal_cents: '0' });

  const add = async () => {
    if (!form.code.trim()) { toast('Enter a code', 'error'); return; }
    const { error } = await supabase.from('coupons').insert({
      code: form.code.toUpperCase(),
      description: form.description || null,
      kind: form.kind,
      value: Number(form.value) || 0,
      min_subtotal_cents: Number(form.min_subtotal_cents) || 0,
      active: true,
    });
    if (error) { toast(error.message, 'error'); return; }
    toast('Coupon created');
    setForm({ code: '', description: '', kind: 'percent', value: '10', min_subtotal_cents: '0' });
    onChange();
  };

  const toggle = async (c: Coupon) => { await supabase.from('coupons').update({ active: !c.active }).eq('id', c.id); onChange(); };
  const remove = async (c: Coupon) => { if (confirm(`Delete ${c.code}?`)) { await supabase.from('coupons').delete().eq('id', c.id); onChange(); } };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold">Discounts & coupons</h2>
      <div className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
        <h3 className="font-medium">Create coupon</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field2 label="Code"><input className="input uppercase" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} /></Field2>
          <Field2 label="Type"><select className="input" value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}><option value="percent">Percent</option><option value="fixed">Fixed</option><option value="shipping">Free shipping</option></select></Field2>
          <Field2 label="Value"><input type="number" className="input" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} /></Field2>
          <Field2 label="Min subtotal (cents)"><input type="number" className="input" value={form.min_subtotal_cents} onChange={(e) => setForm((f) => ({ ...f, min_subtotal_cents: e.target.value }))} /></Field2>
          <div className="sm:col-span-2 lg:col-span-4"><button onClick={add} className="btn-primary"><Plus size={16} /> Add coupon</button></div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {coupons.map((c) => (
          <div key={c.id} className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-bold">{c.code}</span>
              <span className={classNames('chip', c.active ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' : 'bg-ink-100 text-ink-500 dark:bg-ink-800')}>{c.active ? 'Active' : 'Inactive'}</span>
            </div>
            <p className="mt-2 text-sm text-ink-500">{c.description ?? `${c.kind} discount`}</p>
            <p className="mt-1 text-sm font-medium">{c.kind === 'percent' ? `${c.value}% off` : c.kind === 'fixed' ? `${c.value} cents off` : 'Free shipping'}</p>
            {c.min_subtotal_cents > 0 && <p className="text-xs text-ink-400">Min spend {c.min_subtotal_cents} cents</p>}
            <div className="mt-4 flex gap-2">
              <button onClick={() => toggle(c)} className="btn-ghost !py-1.5 !text-xs">{c.active ? <Ban size={13} /> : <Check size={13} />} {c.active ? 'Disable' : 'Enable'}</button>
              <button onClick={() => remove(c)} className="btn-ghost !py-1.5 !text-xs text-rose-600"><Trash2 size={13} /> Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Reviews moderation ----------
function ReviewsView({ reviews, onChange }: { reviews: Review[]; onChange: () => void }) {
  const { toast } = useStore();
  const setApproved = async (r: Review, approved: boolean) => {
    await supabase.from('reviews').update({ is_approved: approved }).eq('id', r.id);
    toast(approved ? 'Review approved' : 'Review hidden', 'info');
    onChange();
  };
  const remove = async (r: Review) => { if (confirm('Delete this review?')) { await supabase.from('reviews').delete().eq('id', r.id); onChange(); } };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold">Review moderation ({reviews.length})</h2>
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.author_name}</span>
                  <span className="flex">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={12} className="text-gold-500" fill="currentColor" />)}</span>
                  <span className={classNames('chip', r.is_approved ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' : 'bg-ink-100 text-ink-500 dark:bg-ink-800')}>{r.is_approved ? 'Published' : 'Hidden'}</span>
                </div>
                {r.title && <p className="mt-1 font-medium">{r.title}</p>}
                <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">{r.body}</p>
                <p className="mt-1 text-xs text-ink-400">{formatDate(r.created_at)}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => setApproved(r, !r.is_approved)} className="btn-ghost !py-1.5 !text-xs">{r.is_approved ? 'Hide' : 'Approve'}</button>
                <button onClick={() => remove(r)} className="btn-ghost !py-1.5 !text-xs text-rose-600"><Trash2 size={13} /></button>
              </div>
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="rounded-2xl border border-dashed border-ink-300 p-8 text-center text-ink-400 dark:border-ink-700">No reviews yet.</p>}
      </div>
    </div>
  );
}

// ---------- Banners (placeholder UI) ----------
function BannersView() {
  const banners = [
    { id: 1, title: 'Summer Sale', placement: 'Homepage hero', active: true },
    { id: 2, title: 'New arrivals', placement: 'Category strip', active: true },
    { id: 3, title: 'Home refresh', placement: 'Promo grid', active: true },
  ];
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold">Banners</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {banners.map((b) => (
          <div key={b.id} className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
            <div className="flex items-center justify-between">
              <ImageIcon size={20} className="text-brand-600" />
              <span className="chip bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">Active</span>
            </div>
            <h3 className="mt-3 font-display font-semibold">{b.title}</h3>
            <p className="text-sm text-ink-500">{b.placement}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

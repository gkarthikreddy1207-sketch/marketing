import { useEffect, useState } from 'react';
import { User, Package, Heart, MapPin, LogOut, Settings, ShoppingBag, ArrowRight, Plus, Trash2, type LucideIcon } from 'lucide-react';
import { useStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { fetchOrders, fetchProducts } from '../lib/api';
import type { Order, OrderItem, Address, Product } from '../lib/types';
import { useRouter, navigate } from '../lib/router';
import { formatPrice, formatDate, classNames } from '../lib/format';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ProductCard } from '../components/ProductCard';

type Tab = 'overview' | 'orders' | 'wishlist' | 'addresses' | 'settings';

export function ProfilePage() {
  const { route, push } = useRouter();
  const { user, setUser, wishlist, currency, toast } = useStore();
  const [tab, setTab] = useState<Tab>((route.query.tab as Tab) || 'overview');
  const [orders, setOrders] = useState<(Order & { order_items?: OrderItem[] })[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login?redirect=/profile'); return; }
    let active = true;
    (async () => {
      setLoading(true);
      const [o, w] = await Promise.all([
        fetchOrders(user.id).catch(() => [] as (Order & { order_items?: OrderItem[] })[]),
        wishlist.length ? fetchProducts({ ids: wishlist, limit: 50 }) : Promise.resolve({ items: [], total: 0 }),
      ]);
      if (!active) return;
      setOrders(o);
      setWishlistProducts(w.items);
      const { data: addr } = await supabase.from('addresses').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (active) setAddresses((addr ?? []) as Address[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [user, wishlist]);

  useEffect(() => { if (route.query.tab) setTab(route.query.tab as Tab); }, [route.query.tab]);

  if (!user) return null;

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  const totalSpent = orders.reduce((s, o) => s + o.total_cents, 0);

  const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="container-page py-8 animate-fade-in">
      <Breadcrumbs items={[{ label: 'My account' }]} />
      <h1 className="mt-4 font-display text-3xl font-semibold md:text-4xl">My account</h1>
      <p className="mt-1 text-sm text-ink-500">{user.email}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside>
          <nav className="space-y-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); push(`/profile?tab=${t.id}`); }}
                className={classNames('flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-colors', tab === t.id ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800')}
              >
                <t.icon size={17} /> {t.label}
              </button>
            ))}
            <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20">
              <LogOut size={17} /> Sign out
            </button>
          </nav>
        </aside>

        <div>
          {loading ? (
            <div className="skeleton h-64 rounded-2xl" />
          ) : (
            <>
              {tab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard label="Orders" value={String(orders.length)} icon={Package} />
                    <StatCard label="Total spent" value={formatPrice(totalSpent, currency)} icon={ShoppingBag} />
                    <StatCard label="Wishlist items" value={String(wishlist.length)} icon={Heart} />
                  </div>
                  <div className="rounded-2xl border border-ink-200 p-6 dark:border-ink-800">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-lg font-semibold">Recent orders</h2>
                      <button onClick={() => { setTab('orders'); push('/profile?tab=orders'); }} className="link-underline text-sm font-medium text-brand-700 dark:text-brand-400">View all</button>
                    </div>
                    {orders.length === 0 ? (
                      <p className="mt-4 text-sm text-ink-500">No orders yet. <button onClick={() => navigate('/shop')} className="font-medium text-brand-700 hover:underline">Start shopping</button></p>
                    ) : (
                      <ul className="mt-4 divide-y divide-ink-100 dark:divide-ink-800">
                        {orders.slice(0, 3).map((o) => (
                          <li key={o.id} className="flex items-center justify-between py-3">
                            <div>
                              <p className="text-sm font-medium">{o.order_number}</p>
                              <p className="text-xs text-ink-400">{formatDate(o.created_at)} · {formatPrice(o.total_cents, currency)}</p>
                            </div>
                            <button onClick={() => navigate(`/order/${o.id}?n=${o.order_number}`)} className="btn-ghost !py-1.5 !text-xs">Track <ArrowRight size={14} /></button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {tab === 'orders' && (
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <EmptyState icon={Package} title="No orders yet" sub="Your order history will appear here." cta="Browse products" to="/shop" />
                  ) : (
                    orders.map((o) => (
                      <div key={o.id} className="rounded-2xl border border-ink-200 p-5 dark:border-ink-800">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-display font-semibold">{o.order_number}</p>
                            <p className="text-xs text-ink-400">Placed {formatDate(o.created_at)}</p>
                          </div>
                          <span className={classNames('chip', o.status === 'delivered' ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' : 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300')}>{o.status}</span>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          {(o.order_items ?? []).slice(0, 4).map((i) => (
                            <img key={i.id} src={i.image ?? ''} alt={i.name} className="h-12 w-12 rounded-lg object-cover" loading="lazy" />
                          ))}
                          {(o.order_items?.length ?? 0) > 4 && <span className="text-xs text-ink-400">+{o.order_items!.length - 4} more</span>}
                          <div className="ml-auto flex items-center gap-3">
                            <span className="font-semibold">{formatPrice(o.total_cents, currency)}</span>
                            <button onClick={() => navigate(`/order/${o.id}?n=${o.order_number}`)} className="btn-outline !py-1.5 !text-xs">View / track</button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === 'wishlist' && (
                <div>
                  {wishlistProducts.length === 0 ? (
                    <EmptyState icon={Heart} title="Your wishlist is empty" sub="Save products to revisit them here." cta="Discover products" to="/shop" />
                  ) : (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      {wishlistProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                    </div>
                  )}
                </div>
              )}

              {tab === 'addresses' && (
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-semibold">Saved addresses</h2>
                    <button onClick={() => toast('Address creation form would open here', 'info')} className="btn-primary !py-2"><Plus size={16} /> Add address</button>
                  </div>
                  {addresses.length === 0 ? (
                    <p className="mt-4 text-sm text-ink-500">No saved addresses yet. Addresses from your orders will be saved at checkout.</p>
                  ) : (
                    <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                      {addresses.map((a) => (
                        <li key={a.id} className="rounded-2xl border border-ink-200 p-5 dark:border-ink-800">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{a.full_name}</p>
                              <p className="mt-1 text-sm text-ink-500">{a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{a.city}, {a.postal}<br />{a.country}</p>
                            </div>
                            <button onClick={async () => { await supabase.from('addresses').delete().eq('id', a.id); setAddresses((prev) => prev.filter((x) => x.id !== a.id)); }} aria-label="Delete" className="text-ink-400 hover:text-rose-500"><Trash2 size={16} /></button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {tab === 'settings' && (
                <div className="max-w-md rounded-2xl border border-ink-200 p-6 dark:border-ink-800">
                  <h2 className="font-display text-lg font-semibold">Account settings</h2>
                  <p className="mt-2 text-sm text-ink-500">Email: <span className="font-medium text-ink-900 dark:text-ink-100">{user.email}</span></p>
                  <div className="mt-4 space-y-3">
                    <button onClick={() => toast('Password reset email sent', 'info')} className="btn-outline w-full">Reset password</button>
                    <button onClick={signOut} className="btn w-full border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-900/20">Sign out</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-ink-200 p-5 dark:border-ink-800">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400"><Icon size={18} /></div>
      <p className="mt-3 font-display text-2xl font-bold">{value}</p>
      <p className="text-sm text-ink-500">{label}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub, cta, to }: { icon: LucideIcon; title: string; sub: string; cta: string; to: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-ink-300 py-16 text-center dark:border-ink-700">
      <Icon size={32} className="text-ink-400" />
      <div><p className="font-display text-lg font-semibold">{title}</p><p className="mt-1 text-sm text-ink-500">{sub}</p></div>
      <button onClick={() => navigate(to)} className="btn-primary">{cta} <ArrowRight size={16} /></button>
    </div>
  );
}

import { useState } from 'react';
import { Search, Package, Truck, CheckCircle2, Home, Clock, MapPin } from 'lucide-react';
import { fetchOrderById } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { Order } from '../lib/types';
import { useStore } from '../lib/store';
import { navigate } from '../lib/router';
import { formatPrice, formatDate, formatDateTime, classNames } from '../lib/format';
import { Breadcrumbs } from '../components/Breadcrumbs';

export function TrackOrderPage() {
  const { currency } = useStore();
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      // Accept either order UUID or order number; fetchOrderById expects UUID.
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);
      let data: Order | null = null;
      if (isUuid) {
        data = await fetchOrderById(q);
      } else {
        const { data: d, error } = await supabase.from('orders').select('*').eq('order_number', q.toUpperCase()).maybeSingle();
        if (error) throw error;
        data = d as Order | null;
      }
      if (!data) setError('No order found with that number. Double-check and try again.');
      else setOrder(data);
    } catch {
      setError('Something went wrong looking up the order.');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['paid', 'processing', 'shipped', 'delivered'] as const;
  const currentStep = order ? Math.max(0, steps.indexOf(order.status as typeof steps[number])) : 0;
  const eta = order ? new Date(new Date(order.created_at).getTime() + 4 * 86400000) : null;

  return (
    <div className="container-page py-12 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Track order' }]} />
      <div className="mx-auto mt-6 max-w-2xl">
        <h1 className="font-display text-3xl font-semibold md:text-4xl">Track your order</h1>
        <p className="mt-2 text-ink-500">Enter your order number (e.g. MA-XXXX-XXXX) to see live status.</p>

        <form onSubmit={lookup} className="mt-6 flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Order number" className="input pl-11" aria-label="Order number" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Searching…' : 'Track'}</button>
        </form>

        {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">{error}</p>}

        {order && (
          <div className="mt-8 space-y-6 animate-fade-up">
            <div className="rounded-2xl border border-ink-200 p-6 dark:border-ink-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-ink-500">Order</p>
                  <p className="font-display text-xl font-bold">{order.order_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-ink-500">Placed</p>
                  <p className="font-medium">{formatDate(order.created_at)}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-4 gap-2">
                {[
                  { icon: CheckCircle2, label: 'Confirmed', date: order.created_at },
                  { icon: Package, label: 'Processing', date: null },
                  { icon: Truck, label: 'Shipped', date: null },
                  { icon: Home, label: 'Delivered', date: null },
                ].map((s, i) => (
                  <div key={s.label} className="flex flex-col items-center text-center">
                    <span className={classNames('flex h-11 w-11 items-center justify-center rounded-full', i <= currentStep ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-400 dark:bg-ink-800')}>
                      <s.icon size={19} />
                    </span>
                    <span className={classNames('mt-2 text-xs font-medium', i <= currentStep ? 'text-ink-900 dark:text-ink-100' : 'text-ink-400')}>{s.label}</span>
                    {s.date && i === currentStep && <span className="mt-0.5 text-[10px] text-ink-400">{formatDateTime(s.date)}</span>}
                  </div>
                ))}
              </div>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${(currentStep / 3) * 100}%` }} />
              </div>

              {order.tracking_number && (
                <p className="mt-4 rounded-xl bg-ink-50 p-3 text-sm dark:bg-ink-900">
                  <span className="text-ink-500">Tracking number: </span>
                  <span className="font-medium">{order.tracking_number}</span>
                </p>
              )}
            </div>

            {eta && (
              <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-800 dark:bg-brand-900/20">
                <Clock size={20} className="text-brand-600" />
                <p className="text-sm text-brand-800 dark:text-brand-300">Estimated delivery by <strong>{formatDate(eta.toISOString())}</strong></p>
              </div>
            )}

            <div className="rounded-2xl border border-ink-200 p-6 dark:border-ink-800">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><MapPin size={18} /> Shipping to</h2>
              <p className="mt-3 text-sm text-ink-600 dark:text-ink-300">
                {order.shipping_name}<br />{order.shipping_address}<br />{order.shipping_city}, {order.shipping_postal}<br />{order.shipping_country}
              </p>
              <div className="mt-4 border-t border-ink-100 pt-4 dark:border-ink-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-500">Total paid</span>
                  <span className="font-display text-lg font-bold">{formatPrice(order.total_cents, currency)}</span>
                </div>
              </div>
            </div>

            <button onClick={() => navigate('/profile?tab=orders')} className="btn-outline">View all orders</button>
          </div>
        )}
      </div>
    </div>
  );
}

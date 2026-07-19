import { useEffect, useState } from 'react';
import { CheckCircle2, Package, Truck, Home, Copy, ArrowRight, MapPin } from 'lucide-react';
import { fetchOrderById } from '../lib/api';
import type { Order, OrderItem } from '../lib/types';
import { useStore } from '../lib/store';
import { useRouter, navigate } from '../lib/router';
import { formatPrice, formatDate, classNames } from '../lib/format';
import { Breadcrumbs } from '../components/Breadcrumbs';

export function OrderConfirmationPage() {
  const { route } = useRouter();
  const { currency } = useStore();
  const orderId = route.params.id ?? route.query.id ?? '';
  const orderNumber = route.query.n ?? '';
  const [order, setOrder] = useState<(Order & { order_items?: OrderItem[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    fetchOrderById(orderId).then((o) => { setOrder(o); setLoading(false); }).catch(() => setLoading(false));
  }, [orderId]);

  const copyNum = () => {
    navigator.clipboard.writeText(orderNumber || order?.order_number || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = ['paid', 'processing', 'shipped', 'delivered'] as const;
  const currentStep = order ? Math.max(0, steps.indexOf(order.status as typeof steps[number])) : 0;

  return (
    <div className="container-page py-12 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Order confirmation' }]} />

      <div className="mt-8 max-w-3xl">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold">Thank you for your order!</h1>
            <p className="mt-1 text-ink-500">A confirmation email is on its way to your inbox.</p>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 skeleton h-64 rounded-2xl" />
        ) : order ? (
          <>
            <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-ink-200 p-4 dark:border-ink-800">
              <span className="text-sm text-ink-500">Order number</span>
              <span className="font-display text-lg font-bold">{order.order_number}</span>
              <button onClick={copyNum} className="btn-ghost !py-1 !text-xs">{copied ? 'Copied' : 'Copy'}</button>
              <span className="ml-auto text-sm text-ink-500">{formatDate(order.created_at)}</span>
            </div>

            {/* tracking timeline */}
            <div className="mt-6 rounded-2xl border border-ink-200 p-6 dark:border-ink-800">
              <h2 className="font-display text-lg font-semibold">Order status</h2>
              <ol className="mt-5 grid grid-cols-4 gap-2">
                {[
                  { icon: CheckCircle2, label: 'Confirmed' },
                  { icon: Package, label: 'Processing' },
                  { icon: Truck, label: 'Shipped' },
                  { icon: Home, label: 'Delivered' },
                ].map((s, i) => (
                  <li key={s.label} className="flex flex-col items-center text-center">
                    <span className={classNames('flex h-10 w-10 items-center justify-center rounded-full', i <= currentStep ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-400 dark:bg-ink-800')}>
                      <s.icon size={18} />
                    </span>
                    <span className={classNames('mt-2 text-xs font-medium', i <= currentStep ? 'text-ink-900 dark:text-ink-100' : 'text-ink-400')}>{s.label}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(currentStep / 3) * 100}%` }} />
              </div>
            </div>

            {/* items */}
            <div className="mt-6 rounded-2xl border border-ink-200 p-6 dark:border-ink-800">
              <h2 className="font-display text-lg font-semibold">Items</h2>
              <ul className="mt-4 divide-y divide-ink-100 dark:divide-ink-800">
                {(order.order_items ?? []).map((i) => (
                  <li key={i.id} className="flex items-center gap-4 py-3">
                    <img src={i.image ?? ''} alt={i.name} className="h-14 w-14 rounded-lg object-cover" loading="lazy" />
                    <div className="flex-1"><p className="text-sm font-medium">{i.name}</p><p className="text-xs text-ink-400">Qty {i.qty}</p></div>
                    <span className="font-semibold">{formatPrice(i.price_cents * i.qty, currency)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-sm dark:border-ink-800">
                <div className="flex justify-between"><dt className="text-ink-500">Subtotal</dt><dd>{formatPrice(order.subtotal_cents, currency)}</dd></div>
                {order.discount_cents > 0 && <div className="flex justify-between text-brand-700 dark:text-brand-400"><dt>Discount</dt><dd>-{formatPrice(order.discount_cents, currency)}</dd></div>}
                <div className="flex justify-between"><dt className="text-ink-500">Shipping</dt><dd>{order.shipping_cents === 0 ? 'Free' : formatPrice(order.shipping_cents, currency)}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-500">Tax</dt><dd>{formatPrice(order.tax_cents, currency)}</dd></div>
                <div className="flex justify-between border-t border-ink-100 pt-2 dark:border-ink-800"><dt className="font-display font-semibold">Total</dt><dd className="font-display text-lg font-bold">{formatPrice(order.total_cents, currency)}</dd></div>
              </dl>
            </div>

            {/* shipping */}
            <div className="mt-6 rounded-2xl border border-ink-200 p-6 dark:border-ink-800">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><MapPin size={18} /> Shipping to</h2>
              <p className="mt-3 text-sm text-ink-600 dark:text-ink-300">
                {order.shipping_name}<br />
                {order.shipping_address}<br />
                {order.shipping_city}, {order.shipping_postal}<br />
                {order.shipping_country}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => navigate('/track')} className="btn-primary">Track this order <ArrowRight size={16} /></button>
              <button onClick={() => navigate('/shop')} className="btn-outline">Continue shopping</button>
            </div>
          </>
        ) : (
          <div className="mt-8 rounded-2xl border border-ink-200 p-8 text-center dark:border-ink-800">
            <p className="text-ink-500">We could not locate this order. If you just placed it, please wait a moment and refresh.</p>
            <button onClick={() => navigate('/shop')} className="btn-primary mt-4">Back to shop</button>
          </div>
        )}
      </div>
    </div>
  );
}

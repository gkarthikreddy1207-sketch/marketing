import { useState } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag, X, Truck } from 'lucide-react';
import { useStore } from '../lib/store';
import { fetchCouponByCode } from '../lib/api';
import type { Coupon } from '../lib/types';
import {
  formatPrice, SHIPPING_FLAT_CENTS, SHIPPING_FREE_THRESHOLD_CENTS, TAX_RATE, classNames,
} from '../lib/format';
import { navigate } from '../lib/router';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Image } from '../components/Image';

export function CartPage() {
  const { cart, setQty, removeFromCart, cartSubtotal, currency, toast } = useStore();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [checking, setChecking] = useState(false);

  const applyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) return;
    setChecking(true);
    try {
      const c = await fetchCouponByCode(codeInput.trim());
      if (!c) { toast('Invalid coupon code', 'error'); setCoupon(null); }
      else if (c.min_subtotal_cents > cartSubtotal) {
        toast(`Spend ${formatPrice(c.min_subtotal_cents, currency)} to use this code`, 'error');
        setCoupon(null);
      } else {
        setCoupon(c);
        toast('Coupon applied!');
      }
    } catch {
      toast('Could not validate coupon', 'error');
    } finally {
      setChecking(false);
    }
  };

  const removeCoupon = () => { setCoupon(null); setCodeInput(''); };

  const discount = coupon
    ? coupon.kind === 'percent'
      ? Math.round((cartSubtotal * coupon.value) / 100)
      : coupon.kind === 'fixed'
        ? Math.min(coupon.value, cartSubtotal)
        : 0
    : 0;

  const shippingBase = cartSubtotal >= SHIPPING_FREE_THRESHOLD_CENTS ? 0 : SHIPPING_FLAT_CENTS;
  const shipping = coupon?.kind === 'shipping' ? 0 : shippingBase;
  const tax = Math.round((cartSubtotal - discount) * TAX_RATE);
  const total = Math.max(0, cartSubtotal - discount + shipping + tax);

  if (cart.length === 0) {
    return (
      <div className="container-page py-16 animate-fade-in">
        <Breadcrumbs items={[{ label: 'Cart' }]} />
        <div className="mt-10 flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-ink-300 py-20 text-center dark:border-ink-700">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ink-100 dark:bg-ink-800">
            <ShoppingBag size={32} className="text-ink-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold">Your cart is empty</h1>
            <p className="mt-1 text-ink-500">Browse the collection and add your favorites.</p>
          </div>
          <button onClick={() => navigate('/shop')} className="btn-primary">Continue shopping <ArrowRight size={16} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-8 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Cart' }]} />
      <h1 className="mt-4 font-display text-3xl font-semibold md:text-4xl">Shopping cart</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <ul className="space-y-4">
            {cart.map((item) => (
              <li key={item.product_id} className="flex gap-4 rounded-2xl border border-ink-200 p-4 dark:border-ink-800">
                <button onClick={() => navigate(`/product/${item.slug}`)} className="shrink-0">
                  <Image src={item.image ?? ''} alt={item.name} ratio="w-24 h-24" className="rounded-xl" />
                </button>
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between gap-3">
                    <button onClick={() => navigate(`/product/${item.slug}`)} className="font-medium hover:text-brand-700">{item.name}</button>
                    <button onClick={() => removeFromCart(item.product_id)} aria-label="Remove" className="text-ink-400 hover:text-rose-500">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-ink-500">Unit: {formatPrice(item.price_cents, currency)}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-ink-200 dark:border-ink-700">
                      <button onClick={() => setQty(item.product_id, item.qty - 1)} aria-label="Decrease" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-ink-100 dark:hover:bg-ink-800"><Minus size={15} /></button>
                      <span className="w-10 text-center text-sm font-medium">{item.qty}</span>
                      <button onClick={() => setQty(item.product_id, item.qty + 1)} disabled={item.qty >= item.max} aria-label="Increase" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-ink-100 disabled:opacity-40 dark:hover:bg-ink-800"><Plus size={15} /></button>
                    </div>
                    <span className="font-display text-lg font-bold">{formatPrice(item.price_cents * item.qty, currency)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <button onClick={() => navigate('/shop')} className="btn-ghost mt-4">← Continue shopping</button>
        </div>

        {/* summary */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-ink-200 p-5 dark:border-ink-800">
            <h2 className="font-display text-lg font-semibold">Order summary</h2>

            {/* coupon */}
            <div className="mt-4">
              {coupon ? (
                <div className="flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2.5 dark:bg-brand-900/30">
                  <span className="flex items-center gap-2 text-sm font-medium text-brand-700 dark:text-brand-300"><Tag size={15} /> {coupon.code}</span>
                  <button onClick={removeCoupon} aria-label="Remove coupon" className="text-brand-700 hover:text-brand-900 dark:text-brand-300"><X size={15} /></button>
                </div>
              ) : (
                <form onSubmit={applyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                    <input value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="Coupon code" className="input pl-9 uppercase" aria-label="Coupon code" />
                  </div>
                  <button type="submit" disabled={checking} className="btn-outline !px-4">{checking ? '…' : 'Apply'}</button>
                </form>
              )}
              <p className="mt-2 text-xs text-ink-400">Try WELCOME10, SAVE25, or FREESHIP</p>
            </div>

            <dl className="mt-5 space-y-2.5 text-sm">
              <Row label="Subtotal" value={formatPrice(cartSubtotal, currency)} />
              {discount > 0 && <Row label="Discount" value={`-${formatPrice(discount, currency)}`} accent="text-brand-700 dark:text-brand-400" />}
              <Row
                label="Shipping"
                value={shipping === 0 ? 'FREE' : formatPrice(shipping, currency)}
                hint={shipping > 0 ? `Free over ${formatPrice(SHIPPING_FREE_THRESHOLD_CENTS, currency)}` : undefined}
              />
              <Row label="Tax (est. 8%)" value={formatPrice(tax, currency)} />
              <div className="my-2 h-px bg-ink-100 dark:bg-ink-800" />
              <div className="flex items-center justify-between">
                <dt className="font-display text-base font-semibold">Total</dt>
                <dd className="font-display text-xl font-bold">{formatPrice(total, currency)}</dd>
              </div>
            </dl>

            <div className="mt-3 flex items-center gap-2 rounded-xl bg-ink-50 p-3 text-xs text-ink-500 dark:bg-ink-900">
              <Truck size={15} className="text-brand-600" />
              {cartSubtotal >= SHIPPING_FREE_THRESHOLD_CENTS ? 'You qualify for free shipping!' : `Add ${formatPrice(SHIPPING_FREE_THRESHOLD_CENTS - cartSubtotal, currency)} for free shipping`}
            </div>

            <button onClick={() => navigate('/checkout')} className="btn-primary mt-5 w-full !py-3 text-base">
              Proceed to checkout <ArrowRight size={18} />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-500">
        {label}
        {hint && <span className="ml-1 text-xs text-ink-400">({hint})</span>}
      </dt>
      <dd className={classNames('font-medium', accent ?? 'text-ink-900 dark:text-ink-100')}>{value}</dd>
    </div>
  );
}

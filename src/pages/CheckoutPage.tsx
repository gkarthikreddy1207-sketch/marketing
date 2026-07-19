import { useState } from 'react';
import { CreditCard, Wallet, Truck, Banknote, Check, Lock, ArrowLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../lib/store';
import { createOrder } from '../lib/api';
import {
  formatPrice, SHIPPING_FLAT_CENTS, SHIPPING_FREE_THRESHOLD_CENTS, TAX_RATE,
  generateOrderNumber, classNames,
} from '../lib/format';
import { navigate, useRouter } from '../lib/router';
import { Breadcrumbs } from '../components/Breadcrumbs';
import type { Coupon } from '../lib/types';

const PAYMENTS = [
  { id: 'card', label: 'Credit / Debit card', icon: CreditCard, sub: 'Visa, Mastercard, Amex' },
  { id: 'wallet', label: 'Digital wallet', icon: Wallet, sub: 'Apple Pay, Google Pay' },
  { id: 'cod', label: 'Cash on delivery', icon: Banknote, sub: 'Pay when it arrives' },
];

export function CheckoutPage() {
  const { route } = useRouter();
  const { cart, cartSubtotal, currency, clearCart, toast, user } = useStore();
  const couponFromQuery = route.query.coupon ? ({ code: route.query.coupon, kind: 'percent' as const, value: 10, min_subtotal_cents: 0 } as Coupon) : null;
  const [coupon, setCoupon] = useState<Coupon | null>(couponFromQuery);
  const [step, setStep] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [form, setForm] = useState({
    email: user?.email ?? '',
    fullName: '', line1: '', line2: '', city: '', postal: '', country: 'United States', phone: '',
    shippingMethod: 'express',
    payment: 'card',
    cardName: '', cardNumber: '', cardExp: '', cardCvc: '',
    notes: '',
  });

  const discount = coupon && coupon.kind === 'percent' ? Math.round((cartSubtotal * coupon.value) / 100) : coupon?.kind === 'fixed' ? Math.min(coupon.value, cartSubtotal) : 0;
  const shippingBase = cartSubtotal >= SHIPPING_FREE_THRESHOLD_CENTS ? 0 : SHIPPING_FLAT_CENTS;
  const shipping = coupon?.kind === 'shipping' ? 0 : form.shippingMethod === 'express' ? shippingBase : shippingBase + 500;
  const tax = Math.round((cartSubtotal - discount) * TAX_RATE);
  const total = Math.max(0, cartSubtotal - discount + shipping + tax);

  if (cart.length === 0 && !placing) {
    return (
      <div className="container-page py-20 text-center animate-fade-in">
        <h1 className="font-display text-2xl font-semibold">Your cart is empty</h1>
        <button onClick={() => navigate('/shop')} className="btn-primary mt-4">Shop now</button>
      </div>
    );
  }

  const next = () => {
    if (step === 1) {
      if (!form.email || !form.fullName || !form.line1 || !form.city || !form.postal) {
        toast('Please complete all required address fields', 'error');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (form.payment === 'card' && (!form.cardName || !form.cardNumber || !form.cardExp || !form.cardCvc)) {
        toast('Please complete card details', 'error');
        return;
      }
      setStep(3);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const placeOrder = async () => {
    setPlacing(true);
    try {
      const orderNumber = generateOrderNumber();
      const order = await createOrder(
        {
          order_number: orderNumber,
          status: 'paid',
          payment_method: form.payment,
          subtotal_cents: cartSubtotal,
          discount_cents: discount,
          shipping_cents: shipping,
          tax_cents: tax,
          total_cents: total,
          currency,
          coupon_code: coupon?.code ?? null,
          shipping_name: form.fullName,
          shipping_address: `${form.line1}${form.line2 ? ', ' + form.line2 : ''}`,
          shipping_city: form.city,
          shipping_postal: form.postal,
          shipping_country: form.country,
          shipping_method: form.shippingMethod,
          notes: form.notes || null,
        },
        cart.map((i) => ({
          product_id: i.product_id,
          name: i.name,
          sku: i.slug,
          price_cents: i.price_cents,
          qty: i.qty,
          image: i.image,
        })),
      );
      clearCart();
      navigate(`/order/${order.id}?n=${order.order_number}`);
    } catch (e) {
      toast('Order could not be placed. Please try again.', 'error');
      setPlacing(false);
    }
  };

  return (
    <div className="container-page py-8 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />
      <h1 className="mt-4 font-display text-3xl font-semibold md:text-4xl">Checkout</h1>

      {/* steps indicator */}
      <ol className="mt-6 flex items-center gap-2 text-sm">
        {['Information', 'Payment', 'Review'].map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span className={classNames('flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold', step > i + 1 ? 'bg-brand-600 text-white' : step === i + 1 ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900' : 'bg-ink-100 text-ink-500 dark:bg-ink-800')}>
              {step > i + 1 ? <Check size={14} /> : i + 1}
            </span>
            <span className={classNames('font-medium', step === i + 1 ? 'text-ink-900 dark:text-ink-100' : 'text-ink-400')}>{s}</span>
            {i < 2 && <ChevronRight size={16} className="text-ink-300" />}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <Section title="Contact">
                <Field label="Email" required>
                  <input type="email" className="input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
                </Field>
              </Section>
              <Section title="Shipping address">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" required>
                    <input className="input" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required />
                  </Field>
                  <Field label="Phone">
                    <input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Address line 1" required>
                      <input className="input" value={form.line1} onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))} required />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Address line 2 (optional)">
                      <input className="input" value={form.line2} onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))} />
                    </Field>
                  </div>
                  <Field label="City" required>
                    <input className="input" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} required />
                  </Field>
                  <Field label="Postal code" required>
                    <input className="input" value={form.postal} onChange={(e) => setForm((f) => ({ ...f, postal: e.target.value }))} required />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Country">
                      <select className="input" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}>
                        {['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'India', 'Japan'].map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </Field>
                  </div>
                </div>
              </Section>
              <Section title="Shipping method">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { id: 'express', label: 'Express', sub: '1–2 business days', price: shippingBase === 0 ? 'Free' : formatPrice(SHIPPING_FLAT_CENTS, currency) },
                    { id: 'standard', label: 'Standard', sub: '3–5 business days', price: formatPrice(SHIPPING_FLAT_CENTS + 500, currency) },
                  ].map((m) => (
                    <button key={m.id} onClick={() => setForm((f) => ({ ...f, shippingMethod: m.id }))} className={classNames('flex items-center justify-between rounded-xl border p-4 text-left transition-colors', form.shippingMethod === m.id ? 'border-brand-600 ring-2 ring-brand-500/30' : 'border-ink-200 hover:border-ink-400 dark:border-ink-700')}>
                      <div className="flex items-center gap-3">
                        <Truck size={18} className="text-brand-600" />
                        <div><p className="text-sm font-semibold">{m.label}</p><p className="text-xs text-ink-400">{m.sub}</p></div>
                      </div>
                      <span className="text-sm font-medium">{m.price}</span>
                    </button>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <Section title="Payment method">
                <div className="grid gap-3">
                  {PAYMENTS.map((p) => (
                    <button key={p.id} onClick={() => setForm((f) => ({ ...f, payment: p.id }))} className={classNames('flex items-center gap-4 rounded-xl border p-4 text-left transition-colors', form.payment === p.id ? 'border-brand-600 ring-2 ring-brand-500/30' : 'border-ink-200 hover:border-ink-400 dark:border-ink-700')}>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400"><p.icon size={18} /></div>
                      <div className="flex-1"><p className="text-sm font-semibold">{p.label}</p><p className="text-xs text-ink-400">{p.sub}</p></div>
                      <span className={classNames('flex h-5 w-5 items-center justify-center rounded-full border', form.payment === p.id ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-300 dark:border-ink-600')}>
                        {form.payment === p.id && <Check size={12} />}
                      </span>
                    </button>
                  ))}
                </div>
              </Section>

              {form.payment === 'card' && (
                <Section title="Card details">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Field label="Name on card" required>
                        <input className="input" value={form.cardName} onChange={(e) => setForm((f) => ({ ...f, cardName: e.target.value }))} required />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="Card number" required>
                        <input className="input" placeholder="4242 4242 4242 4242" value={form.cardNumber} onChange={(e) => setForm((f) => ({ ...f, cardNumber: e.target.value }))} required inputMode="numeric" />
                      </Field>
                    </div>
                    <Field label="Expiry" required>
                      <input className="input" placeholder="MM/YY" value={form.cardExp} onChange={(e) => setForm((f) => ({ ...f, cardExp: e.target.value }))} required />
                    </Field>
                    <Field label="CVC" required>
                      <input className="input" placeholder="123" value={form.cardCvc} onChange={(e) => setForm((f) => ({ ...f, cardCvc: e.target.value }))} required inputMode="numeric" />
                    </Field>
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-xs text-ink-400"><Lock size={13} /> Demo only — no real payment is processed.</p>
                </Section>
              )}

              {form.payment === 'wallet' && (
                <div className="rounded-2xl border border-ink-200 p-6 text-center dark:border-ink-800">
                  <Wallet size={28} className="mx-auto text-brand-600" />
                  <p className="mt-3 text-sm text-ink-500">You will be redirected to your wallet to authorize the payment.</p>
                </div>
              )}

              {form.payment === 'cod' && (
                <div className="rounded-2xl border border-ink-200 p-6 text-center dark:border-ink-800">
                  <Banknote size={28} className="mx-auto text-brand-600" />
                  <p className="mt-3 text-sm text-ink-500">Pay in cash to the courier upon delivery. A small handling fee may apply.</p>
                </div>
              )}

              <Section title="Order notes (optional)">
                <textarea className="input min-h-20" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Delivery instructions, gift message…" />
              </Section>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <Section title="Review your order">
                <ul className="divide-y divide-ink-100 dark:divide-ink-800">
                  {cart.map((i) => (
                    <li key={i.product_id} className="flex items-center gap-4 py-3">
                      <img src={i.image ?? ''} alt={i.name} className="h-16 w-16 rounded-xl object-cover" loading="lazy" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{i.name}</p>
                        <p className="text-xs text-ink-400">Qty {i.qty} · {formatPrice(i.price_cents, currency)}</p>
                      </div>
                      <span className="font-semibold">{formatPrice(i.price_cents * i.qty, currency)}</span>
                    </li>
                  ))}
                </ul>
              </Section>
              <Section title="Shipping to">
                <p className="text-sm text-ink-600 dark:text-ink-300">{form.fullName}<br />{form.line1}{form.line2 ? `, ${form.line2}` : ''}<br />{form.city}, {form.postal}<br />{form.country}</p>
              </Section>
              <Section title="Payment">
                <p className="text-sm text-ink-600 dark:text-ink-300">{PAYMENTS.find((p) => p.id === form.payment)?.label}</p>
              </Section>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            {step > 1 ? (
              <button onClick={() => setStep((s) => s - 1)} className="btn-ghost"><ArrowLeft size={16} /> Back</button>
            ) : (
              <button onClick={() => navigate('/cart')} className="btn-ghost"><ArrowLeft size={16} /> Back to cart</button>
            )}
            {step < 3 ? (
              <button onClick={next} className="btn-primary">Continue <ChevronRight size={16} /></button>
            ) : (
              <button onClick={placeOrder} disabled={placing} className="btn-primary !px-8">
                {placing ? 'Placing order…' : <>Place order · {formatPrice(total, currency)}</>}
              </button>
            )}
          </div>
        </div>

        {/* summary */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-ink-200 p-5 dark:border-ink-800">
            <h2 className="font-display text-lg font-semibold">Summary</h2>
            <ul className="mt-3 max-h-56 space-y-3 overflow-y-auto">
              {cart.map((i) => (
                <li key={i.product_id} className="flex items-center gap-3">
                  <div className="relative">
                    <img src={i.image ?? ''} alt={i.name} className="h-12 w-12 rounded-lg object-cover" loading="lazy" />
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink-900 px-1 text-[10px] font-bold text-white dark:bg-white dark:text-ink-900">{i.qty}</span>
                  </div>
                  <p className="flex-1 line-clamp-2 text-xs font-medium">{i.name}</p>
                  <span className="text-sm font-semibold">{formatPrice(i.price_cents * i.qty, currency)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-sm dark:border-ink-800">
              <div className="flex justify-between"><dt className="text-ink-500">Subtotal</dt><dd>{formatPrice(cartSubtotal, currency)}</dd></div>
              {discount > 0 && <div className="flex justify-between text-brand-700 dark:text-brand-400"><dt>Discount</dt><dd>-{formatPrice(discount, currency)}</dd></div>}
              <div className="flex justify-between"><dt className="text-ink-500">Shipping</dt><dd>{shipping === 0 ? 'Free' : formatPrice(shipping, currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">Tax</dt><dd>{formatPrice(tax, currency)}</dd></div>
              <div className="flex justify-between border-t border-ink-100 pt-2 dark:border-ink-800"><dt className="font-display font-semibold">Total</dt><dd className="font-display text-lg font-bold">{formatPrice(total, currency)}</dd></div>
            </dl>
            <p className="mt-4 flex items-center gap-2 text-xs text-ink-400"><Lock size={13} /> Secure 256-bit SSL checkout</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink-200 p-5 dark:border-ink-800">
      <h2 className="mb-4 font-display text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-rose-500"> *</span>}</label>
      {children}
    </div>
  );
}

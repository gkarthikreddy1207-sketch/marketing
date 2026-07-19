import { useEffect } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { useStore } from '../lib/store';
import { formatPrice, SHIPPING_FREE_THRESHOLD_CENTS } from '../lib/format';
import { navigate } from '../lib/router';
import { Image } from './Image';

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cart, setQty, removeFromCart, cartSubtotal, cartCount, currency } = useStore();

  useEffect(() => {
    if (open) {
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', onKey);
        document.body.style.overflow = '';
      };
    }
  }, [open, onClose]);

  const remaining = SHIPPING_FREE_THRESHOLD_CENTS - cartSubtotal;
  const progress = Math.min(100, (cartSubtotal / SHIPPING_FREE_THRESHOLD_CENTS) * 100);

  return (
    <div className={`fixed inset-0 z-[70] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-ink-950/50 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-lift transition-transform duration-300 dark:bg-ink-950 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-ink-200 p-4 dark:border-ink-800">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} />
            <h2 className="font-display text-lg font-semibold">Your cart ({cartCount})</h2>
          </div>
          <button onClick={onClose} aria-label="Close cart"><X size={22} /></button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ink-100 dark:bg-ink-800">
              <ShoppingBag size={32} className="text-ink-400" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold">Your cart is empty</p>
              <p className="mt-1 text-sm text-ink-500">Discover something you love.</p>
            </div>
            <button onClick={() => { onClose(); navigate('/shop'); }} className="btn-primary">
              Start shopping <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <>
            {/* free shipping progress */}
            <div className="border-b border-ink-200 px-4 py-3 dark:border-ink-800">
              <div className="mb-2 flex items-center gap-2 text-sm">
                <Truck size={16} className="text-brand-600" />
                {remaining > 0 ? (
                  <span className="text-ink-600 dark:text-ink-300">
                    Add <strong className="text-ink-900 dark:text-ink-50">{formatPrice(remaining, currency)}</strong> for free shipping
                  </span>
                ) : (
                  <span className="font-medium text-brand-700 dark:text-brand-400">You unlocked free shipping!</span>
                )}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-4">
                {cart.map((item) => (
                  <li key={item.product_id} className="flex gap-3">
                    <button onClick={() => { onClose(); navigate(`/product/${item.slug}`); }} className="shrink-0">
                      <Image src={item.image ?? ''} alt={item.name} ratio="w-20 h-20" className="rounded-xl" />
                    </button>
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between gap-2">
                        <button onClick={() => { onClose(); navigate(`/product/${item.slug}`); }} className="line-clamp-2 text-left text-sm font-medium hover:text-brand-700">
                          {item.name}
                        </button>
                        <button onClick={() => removeFromCart(item.product_id)} aria-label="Remove" className="text-ink-400 hover:text-rose-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="mt-1 text-sm font-semibold">{formatPrice(item.price_cents, currency)}</p>
                      <div className="mt-auto flex items-center gap-2">
                        <div className="flex items-center rounded-full border border-ink-200 dark:border-ink-700">
                          <button onClick={() => setQty(item.product_id, item.qty - 1)} aria-label="Decrease quantity" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink-100 dark:hover:bg-ink-800">
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                          <button onClick={() => setQty(item.product_id, item.qty + 1)} disabled={item.qty >= item.max} aria-label="Increase quantity" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink-100 disabled:opacity-40 dark:hover:bg-ink-800">
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-ink-200 p-4 dark:border-ink-800">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-ink-500">Subtotal</span>
                <span className="font-display text-xl font-bold">{formatPrice(cartSubtotal, currency)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { onClose(); navigate('/cart'); }} className="btn-outline">View cart</button>
                <button onClick={() => { onClose(); navigate('/checkout'); }} className="btn-primary">
                  Checkout <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

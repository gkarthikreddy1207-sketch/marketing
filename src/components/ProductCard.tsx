import { useState } from 'react';
import { Heart, ShoppingBag, GitCompare, Eye } from 'lucide-react';
import type { Product } from '../lib/types';
import { formatPrice, discountPercent, classNames } from '../lib/format';
import { useStore } from '../lib/store';
import { navigate } from '../lib/router';
import { Image } from './Image';
import { StarRating } from './StarRating';

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addToCart, toggleWishlist, isWishlisted, toggleCompare, compare, currency } = useStore();
  const [animating, setAnimating] = useState(false);
  const wished = isWishlisted(product.id);
  const discount = discountPercent(product.price_cents, product.compare_at_cents);
  const inCompare = compare.includes(product.id);
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card dark:border-ink-800 dark:bg-ink-900"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="relative">
        <button
          onClick={() => navigate(`/product/${product.slug}`)}
          className="block w-full"
          aria-label={`View ${product.name}`}
        >
          <Image
            src={product.primary_image ?? ''}
            alt={product.name}
            ratio="aspect-[4/5]"
            className="rounded-t-2xl"
          />
        </button>

        {/* badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discount > 0 && <span className="badge-sale shadow-soft">-{discount}%</span>}
          {product.is_new_arrival && <span className="badge-new shadow-soft">New</span>}
          {product.is_best_seller && (
            <span className="chip bg-ink-900 text-white shadow-soft dark:bg-white dark:text-ink-900">Best seller</span>
          )}
        </div>

        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm dark:bg-ink-950/70">
            <span className="badge-stock-out">Out of stock</span>
          </div>
        )}

        {/* quick actions */}
        <div className="absolute right-3 top-3 flex flex-col gap-1.5 opacity-0 transition-all duration-300 group-hover:opacity-100">
          <button
            onClick={() => toggleWishlist(product.id)}
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            className={classNames(
              'flex h-9 w-9 items-center justify-center rounded-full shadow-soft transition-colors',
              wished
                ? 'bg-rose-500 text-white'
                : 'bg-white/90 text-ink-700 hover:bg-white dark:bg-ink-900/90 dark:text-ink-200',
            )}
          >
            <Heart size={16} fill={wished ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => toggleCompare(product.id)}
            aria-label="Compare"
            className={classNames(
              'flex h-9 w-9 items-center justify-center rounded-full shadow-soft transition-colors',
              inCompare
                ? 'bg-brand-600 text-white'
                : 'bg-white/90 text-ink-700 hover:bg-white dark:bg-ink-900/90 dark:text-ink-200',
            )}
          >
            <GitCompare size={16} />
          </button>
          <button
            onClick={() => navigate(`/product/${product.slug}`)}
            aria-label="Quick view"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink-700 shadow-soft transition-colors hover:bg-white dark:bg-ink-900/90 dark:text-ink-200"
          >
            <Eye size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-400">{product.brand}</span>
          <StarRating rating={Number(product.rating)} showValue />
        </div>
        <button
          onClick={() => navigate(`/product/${product.slug}`)}
          className="line-clamp-1 text-left font-display text-base font-semibold text-ink-900 transition-colors hover:text-brand-700 dark:text-ink-100 dark:hover:text-brand-400"
        >
          {product.name}
        </button>
        <p className="mt-0.5 line-clamp-1 text-sm text-ink-500 dark:text-ink-400">{product.subtitle}</p>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-ink-900 dark:text-ink-50">
              {formatPrice(product.price_cents, currency)}
            </span>
            {product.compare_at_cents && (
              <span className="text-sm text-ink-400 line-through">
                {formatPrice(product.compare_at_cents, currency)}
              </span>
            )}
          </div>
          {lowStock && <span className="text-xs font-medium text-gold-600 dark:text-gold-400">Only {product.stock} left</span>}
        </div>

        <button
          onClick={() => {
            addToCart(product);
            setAnimating(true);
            setTimeout(() => setAnimating(false), 600);
          }}
          disabled={product.stock === 0}
          className={classNames(
            'mt-4 btn-primary w-full',
            animating && 'scale-95',
          )}
        >
          <ShoppingBag size={16} />
          Add to cart
        </button>
      </div>
    </article>
  );
}

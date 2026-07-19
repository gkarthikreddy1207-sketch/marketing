import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Heart, GitCompare, ShoppingBag, Minus, Plus, Truck, Shield, RotateCcw,
  Star, ChevronRight, Check, Share2,
} from 'lucide-react';
import {
  fetchProductBySlug, fetchProductImages, fetchReviews, fetchRelatedProducts, insertReview,
} from '../lib/api';
import type { Product, ProductImage, Review } from '../lib/types';
import { useStore } from '../lib/store';
import { useRouter, navigate } from '../lib/router';
import { formatPrice, discountPercent, classNames, formatDate } from '../lib/format';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Image } from '../components/Image';
import { StarRating } from '../components/StarRating';
import { ProductCard } from '../components/ProductCard';

export function ProductPage() {
  const { route } = useRouter();
  const slug = route.params.slug ?? route.query.slug ?? '';
  const { addToCart, toggleWishlist, isWishlisted, toggleCompare, compare, currency, pushRecent, toast } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const imgWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true);
    (async () => {
      const p = await fetchProductBySlug(slug);
      if (!active) return;
      setProduct(p);
      setActiveImg(0);
      setQty(1);
      setTab('description');
      if (p) {
        pushRecent(p.id);
        const [imgs, revs, rel] = await Promise.all([
          fetchProductImages(p.id),
          fetchReviews(p.id),
          fetchRelatedProducts(p),
        ]);
        if (!active) return;
        setImages(imgs);
        setReviews(revs);
        setRelated(rel);
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [slug, pushRecent]);

  const gallery = useMemo(() => {
    if (!product) return [];
    const all = [product.primary_image ? { url: product.primary_image, alt: product.name } : null, ...images.map((i) => ({ url: i.url, alt: i.alt ?? product.name }))];
    return all.filter((x): x is { url: string; alt: string } => x !== null);
  }, [product, images]);

  const ratingDist = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    reviews.forEach((r) => { dist[5 - r.rating]++; });
    return dist;
  }, [reviews]);

  if (loading) {
    return (
      <div className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="aspect-square skeleton rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 skeleton rounded-lg" />
            <div className="h-4 w-1/3 skeleton rounded-lg" />
            <div className="h-24 skeleton rounded-lg" />
            <div className="h-12 w-1/2 skeleton rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">Product not found</h1>
        <button onClick={() => navigate('/shop')} className="btn-primary mt-4">Back to shop</button>
      </div>
    );
  }

  const discount = discountPercent(product.price_cents, product.compare_at_cents);
  const wished = isWishlisted(product.id);
  const inCompare = compare.includes(product.id);
  const lowStock = product.stock > 0 && product.stock <= 5;

  const handleZoomMove = (e: React.MouseEvent) => {
    const rect = imgWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoom({ x, y });
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: product.name, url });
      else { await navigator.clipboard.writeText(url); toast('Link copied to clipboard'); }
    } catch { /* user cancelled */ }
  };

  const specsEntries = Object.entries(product.specs);

  // structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: gallery.map((g) => g.url),
    description: product.description ?? product.subtitle ?? '',
    brand: { '@type': 'Brand', name: product.brand ?? 'Maison' },
    sku: product.sku,
    aggregateRating: product.reviews_count > 0 ? {
      '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviews_count,
    } : undefined,
    offers: {
      '@type': 'Offer',
      price: (product.price_cents / 100).toFixed(2),
      priceCurrency: product.currency,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="container-page py-8 animate-fade-in">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <Breadcrumbs items={[
        { label: 'Shop', to: '/shop' },
        ...(product.category_id ? [{ label: 'Catalog', to: '/shop' }] : []),
        { label: product.name },
      ]} />

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* GALLERY */}
        <div className="flex flex-col-reverse gap-4 md:flex-row">
          <div className="flex gap-3 md:flex-col">
            {gallery.map((g, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                onMouseEnter={() => setActiveImg(i)}
                aria-label={`Image ${i + 1}`}
                className={classNames(
                  'h-16 w-16 overflow-hidden rounded-xl border-2 transition-all md:h-20 md:w-20',
                  activeImg === i ? 'border-brand-600 ring-2 ring-brand-500/30' : 'border-ink-200 dark:border-ink-700',
                )}
              >
                <img src={g.url} alt={g.alt} className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
          <div
            ref={imgWrapRef}
            className="relative flex-1 cursor-zoom-in overflow-hidden rounded-3xl border border-ink-200 dark:border-ink-800"
            onMouseMove={handleZoomMove}
            onMouseLeave={() => setZoom(null)}
          >
            <Image src={gallery[activeImg]?.url ?? ''} alt={gallery[activeImg]?.alt ?? product.name} ratio="aspect-square" className="rounded-3xl" />
            {zoom && (
              <div
                className="pointer-events-none absolute inset-0 hidden bg-no-repeat md:block"
                style={{
                  backgroundImage: `url(${gallery[activeImg]?.url})`,
                  backgroundSize: '200%',
                  backgroundPosition: `${zoom.x}% ${zoom.y}%`,
                }}
              />
            )}
            {discount > 0 && <span className="badge-sale absolute left-4 top-4 shadow-soft">-{discount}%</span>}
          </div>
        </div>

        {/* INFO */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium uppercase tracking-wide text-ink-400">{product.brand}</span>
            <div className="flex items-center gap-2">
              <StarRating rating={Number(product.rating)} showValue />
              <span className="text-xs text-ink-400">({product.reviews_count} reviews)</span>
            </div>
          </div>
          <h1 className="mt-2 font-display text-3xl font-semibold md:text-4xl text-balance">{product.name}</h1>
          <p className="mt-2 text-ink-500 dark:text-ink-400">{product.subtitle}</p>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-3xl font-bold text-ink-900 dark:text-ink-50">{formatPrice(product.price_cents, currency)}</span>
            {product.compare_at_cents && (
              <span className="text-lg text-ink-400 line-through">{formatPrice(product.compare_at_cents, currency)}</span>
            )}
            {discount > 0 && <span className="badge-sale">Save {discount}%</span>}
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm">
            {product.stock > 0 ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-brand-700 dark:text-brand-400">
                <Check size={16} /> In stock
                {lowStock && <span className="text-gold-600 dark:text-gold-400">· Only {product.stock} left</span>}
              </span>
            ) : (
              <span className="font-medium text-rose-600">Out of stock</span>
            )}
          </div>

          {/* quantity + add */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-ink-200 dark:border-ink-700">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-ink-100 dark:hover:bg-ink-800">
                <Minus size={16} />
              </button>
              <span className="w-10 text-center font-medium">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(product.stock || 12, q + 1))} aria-label="Increase quantity" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-ink-100 dark:hover:bg-ink-800">
                <Plus size={16} />
              </button>
            </div>
            <button
              onClick={() => addToCart(product, qty)}
              disabled={product.stock === 0}
              className="btn-primary flex-1 !py-3 text-base"
            >
              <ShoppingBag size={18} /> Add to cart
            </button>
            <button
              onClick={() => toggleWishlist(product.id)}
              aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
              className={classNames('flex h-11 w-11 items-center justify-center rounded-full border transition-colors', wished ? 'border-rose-500 bg-rose-500 text-white' : 'border-ink-300 hover:border-ink-900 dark:border-ink-700')}
            >
              <Heart size={18} fill={wished ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => toggleCompare(product.id)}
              aria-label="Compare"
              className={classNames('flex h-11 w-11 items-center justify-center rounded-full border transition-colors', inCompare ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-300 hover:border-ink-900 dark:border-ink-700')}
            >
              <GitCompare size={18} />
            </button>
            <button onClick={share} aria-label="Share" className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-300 hover:border-ink-900 dark:border-ink-700">
              <Share2 size={18} />
            </button>
          </div>

          {/* trust badges */}
          <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl border border-ink-200 p-4 text-center dark:border-ink-800">
            {[
              { icon: Truck, label: 'Free over $75' },
              { icon: RotateCcw, label: '30-day returns' },
              { icon: Shield, label: '2-year warranty' },
            ].map((b) => (
              <div key={b.label} className="flex flex-col items-center gap-1.5">
                <b.icon size={20} className="text-brand-600" />
                <span className="text-xs text-ink-500">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="mt-12">
        <div className="flex gap-1 border-b border-ink-200 dark:border-ink-800">
          {([['description', 'Description'], ['specs', 'Specifications'], ['reviews', `Reviews (${reviews.length})`]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={classNames(
                'relative px-4 py-3 text-sm font-medium transition-colors',
                tab === key ? 'text-ink-900 dark:text-ink-100' : 'text-ink-500 hover:text-ink-800 dark:hover:text-ink-200',
              )}
            >
              {label}
              {tab === key && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-600" />}
            </button>
          ))}
        </div>

        <div className="py-6">
          {tab === 'description' && (
            <div className="prose max-w-none text-ink-700 dark:text-ink-200">
              <p className="text-base leading-relaxed">{product.description}</p>
            </div>
          )}
          {tab === 'specs' && (
            <div className="overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-800">
              <table className="w-full text-sm">
                <tbody>
                  {specsEntries.map(([k, v], i) => (
                    <tr key={k} className={i % 2 === 0 ? 'bg-ink-50 dark:bg-ink-900/50' : ''}>
                      <th className="w-1/3 px-4 py-3 text-left font-medium text-ink-600 dark:text-ink-300">{k}</th>
                      <td className="px-4 py-3 text-ink-900 dark:text-ink-100">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tab === 'reviews' && (
            <ReviewsTab product={product} reviews={reviews} ratingDist={ratingDist} onNew={(r) => setReviews((prev) => [r, ...prev])} />
          )}
        </div>
      </div>

      {/* RELATED */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function ReviewsTab({
  product, reviews, ratingDist, onNew,
}: {
  product: Product; reviews: Review[]; ratingDist: number[]; onNew: (r: Review) => void;
}) {
  const { toast, user } = useStore();
  const [form, setForm] = useState({ author: '', rating: 5, title: '', body: '' });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.author.trim() || !form.body.trim()) {
      toast('Please add your name and review', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const r = await insertReview({
        product_id: product.id,
        author_name: form.author.trim(),
        rating: Number(form.rating),
        title: form.title.trim() || null,
        body: form.body.trim(),
      });
      onNew(r);
      setForm({ author: '', rating: 5, title: '', body: '' });
      toast('Thanks for your review!');
    } catch {
      toast('Could not submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
      <div>
        <div className="rounded-2xl border border-ink-200 p-5 dark:border-ink-800">
          <p className="font-display text-4xl font-bold">{Number(product.rating).toFixed(1)}</p>
          <StarRating rating={Number(product.rating)} size={18} />
          <p className="mt-1 text-sm text-ink-500">{product.reviews_count} reviews</p>
          <div className="mt-4 space-y-1.5">
            {ratingDist.map((count, i) => {
              const stars = 5 - i;
              const pct = reviews.length ? (count / reviews.length) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-2 text-xs">
                  <span className="flex w-8 items-center gap-0.5 text-ink-500">{stars}<Star size={11} className="text-gold-500" fill="currentColor" /></span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                    <div className="h-full rounded-full bg-gold-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-right text-ink-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={submit} className="mt-4 rounded-2xl border border-ink-200 p-5 dark:border-ink-800">
          <h3 className="font-display text-lg font-semibold">Write a review</h3>
          <div className="mt-3 space-y-3">
            <div>
              <label className="label" htmlFor="rev-author">Name</label>
              <input id="rev-author" value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} className="input" placeholder={user?.email ?? 'Your name'} required />
            </div>
            <div>
              <label className="label">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setForm((f) => ({ ...f, rating: n }))} aria-label={`${n} stars`}>
                    <Star size={24} className={n <= form.rating ? 'text-gold-500' : 'text-ink-300 dark:text-ink-600'} fill={n <= form.rating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="rev-title">Title (optional)</label>
              <input id="rev-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="rev-body">Review</label>
              <textarea id="rev-body" value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} className="input min-h-24" required />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full">{submitting ? 'Submitting…' : 'Submit review'}</button>
          </div>
        </form>
      </div>

      <div>
        {reviews.length === 0 ? (
          <p className="text-ink-500">No reviews yet. Be the first to share your thoughts.</p>
        ) : (
          <ul className="space-y-5">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-2xl border border-ink-200 p-5 dark:border-ink-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                      {r.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">{r.author_name}</p>
                      <p className="text-xs text-ink-400">{formatDate(r.created_at)}</p>
                    </div>
                  </div>
                  <StarRating rating={r.rating} />
                </div>
                {r.title && <h4 className="mt-3 font-medium">{r.title}</h4>}
                <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">{r.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

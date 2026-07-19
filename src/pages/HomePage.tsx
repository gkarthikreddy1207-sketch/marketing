import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Star, Quote, Truck, Shield, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchProducts, fetchCategories } from '../lib/api';
import type { Category, Product } from '../lib/types';
import { ProductCard } from '../components/ProductCard';
import { navigate } from '../lib/router';
import { Image } from '../components/Image';

const TESTIMONIALS = [
  { name: 'Amelia R.', role: 'Verified buyer', text: 'The Aurora AirBuds are the best earbuds I have ever used. Shipping was lightning fast and the packaging felt truly premium.', rating: 5, product: 'Aurora AirBuds Pro' },
  { name: 'Daniel K.', role: 'Verified buyer', text: 'Maison has become my go-to for gifts. The curation is impeccable and customer support actually helped me pick the right camera.', rating: 5, product: 'Lumix View X100' },
  { name: 'Sofia L.', role: 'Verified buyer', text: 'I bought the Nordic lounge chair and it transformed my reading nook. Beautiful design and arrived fully assembled.', rating: 5, product: 'Nordic Lounge Chair' },
  { name: 'Marcus T.', role: 'Verified buyer', text: 'Checkout was smooth and I loved being able to compare two laptops side by side. The Summit Book 14 is a beast.', rating: 4, product: 'Summit Book 14' },
];

export function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [ newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const [f, t, b, n, c] = await Promise.all([
        fetchProducts({ featured: true, limit: 8 }),
        fetchProducts({ trending: true, limit: 8 }),
        fetchProducts({ bestSeller: true, limit: 8 }),
        fetchProducts({ newArrival: true, limit: 8 }),
        fetchCategories(),
      ]);
      if (!active) return;
      setFeatured(f.items);
      setTrending(t.items);
      setBestSellers(b.items);
      setNewArrivals(n.items);
      setCats(c.filter((cat) => !cat.parent_id));
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  return (
    <div className="animate-fade-in">
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/5632400/pexels-photo-5632400.jpeg?auto=compress&cs=tinysrgb&w=1800"
            alt=""
            className="h-full w-full object-cover opacity-50"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent" />
        </div>
        <div className="container-page relative grid gap-10 py-20 md:grid-cols-2 md:py-28 lg:py-36">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur animate-fade-up">
              <Sparkles size={14} className="text-gold-400" /> New season · Up to 40% off
            </span>
            <h1 className="animate-fade-up font-display text-4xl font-semibold leading-tight md:text-6xl lg:text-7xl text-balance" style={{ animationDelay: '60ms' }}>
              Curated premium goods, delivered beautifully.
            </h1>
            <p className="mt-5 max-w-md animate-fade-up text-lg text-ink-200" style={{ animationDelay: '120ms' }}>
              Discover electronics, home, fashion and lifestyle essentials — handpicked by experts and backed by a 30-day promise.
            </p>
            <div className="mt-8 flex animate-fade-up flex-wrap gap-3" style={{ animationDelay: '180ms' }}>
              <button onClick={() => navigate('/shop')} className="btn-gold">
                Shop the collection <ArrowRight size={16} />
              </button>
              <button onClick={() => navigate('/shop?filter=deals')} className="btn border border-white/30 text-white hover:bg-white/10">
                Explore deals
              </button>
            </div>
            <div className="mt-10 flex animate-fade-up gap-8" style={{ animationDelay: '240ms' }}>
              <Stat value="16k+" label="Happy customers" />
              <Stat value="4.8★" label="Average rating" />
              <Stat value="24h" label="Express dispatch" />
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute right-0 top-1/2 w-72 -translate-y-1/2 animate-float">
              <img src="https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=900" alt="Featured product" className="rotate-6 rounded-3xl border border-white/20 shadow-lift" />
            </div>
            <div className="absolute right-40 top-8 w-48 animate-float" style={{ animationDelay: '1s' }}>
              <img src="https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Featured product" className="-rotate-6 rounded-2xl border border-white/20 shadow-lift" />
            </div>
          </div>
        </div>
      </section>

      {/* marquee trust bar */}
      <section className="border-y border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-950">
        <div className="overflow-hidden">
          <div className="flex w-max animate-marquee items-center gap-12 py-4 text-sm font-medium uppercase tracking-wide text-ink-400">
            {Array.from({ length: 2 }).flatMap((_, k) =>
              ['Aurora', 'Summit', 'Meridian', 'Studio One', 'Brew Equal', 'Nordic', 'Heritage', 'Lumix', 'Pulse', 'Ridge'].map((b) => (
                <span key={`${k}-${b}`} className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-brand-500" />{b}</span>
              )),
            )}
          </div>
        </div>
      </section>

      <div className="container-page py-14">
        {/* CATEGORIES */}
        <SectionHeader title="Shop by category" subtitle="Find exactly what you need" to="/shop" toLabel="All categories" />
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
          {cats.map((c, i) => (
            <button
              key={c.id}
              onClick={() => navigate(`/shop?category=${c.slug}`)}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-ink-200 bg-white p-4 transition-all hover:-translate-y-1 hover:shadow-card dark:border-ink-800 dark:bg-ink-900"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="h-16 w-16 overflow-hidden rounded-full">
                <Image src={c.image ?? ''} alt={c.name} ratio="h-16 w-16" className="rounded-full transition-transform group-hover:scale-110" />
              </div>
              <span className="text-center text-sm font-medium text-ink-800 dark:text-ink-100">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* FEATURED */}
      <Section id="featured" title="Featured products" subtitle="Editor's picks this season" items={featured} loading={loading} />

      {/* PROMO BANNER */}
      <section className="container-page py-6">
        <div className="grid gap-4 md:grid-cols-3">
          <PromoCard
            title="Summer Sale"
            sub="Up to 40% off audio & wearables"
            cta="Shop deals"
            to="/shop?filter=deals"
            image="https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=900"
            tone="dark"
          />
          <PromoCard
            title="New arrivals"
            sub="Fresh drops every week"
            cta="See what's new"
            to="/shop?sort=newest"
            image="https://images.pexels.com/photos/4498293/pexels-photo-4498293.jpeg?auto=compress&cs=tinysrgb&w=900"
            tone="brand"
          />
          <PromoCard
            title="Home refresh"
            sub="Furniture & lighting picks"
            cta="Shop home"
            to="/shop?category=home"
            image="https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=900"
            tone="gold"
          />
        </div>
      </section>

      {/* TRENDING */}
      <Section id="trending" title="Trending now" subtitle="What everyone is loving" items={trending} loading={loading} />

      {/* BEST SELLERS */}
      <Section id="best" title="Best sellers" subtitle="Tried, tested, and adored" items={bestSellers} loading={loading} />

      {/* VALUE PROPS */}
      <section className="container-page py-10">
        <div className="grid gap-4 rounded-4xl border border-ink-200 bg-white p-8 dark:border-ink-800 dark:bg-ink-900 md:grid-cols-3 md:p-12">
          {[
            { icon: Truck, title: 'Free express shipping', text: 'On all orders over $75. Delivered in 1–5 business days worldwide.' },
            { icon: Shield, title: 'Secure & encrypted', text: '256-bit SSL and PCI-compliant checkout. Your data stays private.' },
            { icon: RotateCcw, title: '30-day returns', text: 'Changed your mind? Return any item within 30 days for a full refund.' },
          ].map((v) => (
            <div key={v.title} className="flex flex-col items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                <v.icon size={22} />
              </div>
              <h3 className="font-display text-lg font-semibold">{v.title}</h3>
              <p className="text-sm text-ink-500 dark:text-ink-400">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <Section id="new" title="New arrivals" subtitle="Just landed in the warehouse" items={newArrivals} loading={loading} />

      {/* TESTIMONIALS */}
      <section className="bg-ink-50 py-16 dark:bg-ink-900/40">
        <div className="container-page">
          <SectionHeader title="Loved by thousands" subtitle="Real reviews from real customers" />
          <TestimonialsCarousel />
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-2xl font-semibold">{value}</p>
      <p className="text-xs text-ink-300">{label}</p>
    </div>
  );
}

function SectionHeader({ title, subtitle, to, toLabel }: { title: string; subtitle?: string; to?: string; toLabel?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl font-semibold md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>}
      </div>
      {to && (
        <button onClick={() => navigate(to)} className="link-underline flex items-center gap-1 text-sm font-medium text-brand-700 dark:text-brand-400">
          {toLabel} <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}

function Section({ id, title, subtitle, items, loading }: { id: string; title: string; subtitle: string; items: Product[]; loading: boolean }) {
  const [page, setPage] = useState(0);
  const perPage = 4;
  const maxPage = Math.max(0, Math.ceil(items.length / perPage) - 1);
  const view = items.slice(page * perPage, page * perPage + perPage);

  return (
    <section id={id} className="container-page py-10">
      <div className="flex items-end justify-between gap-4">
        <SectionHeader title={title} subtitle={subtitle} />
        <div className="hidden items-center gap-2 md:flex">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} aria-label="Previous" className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 hover:bg-ink-100 disabled:opacity-40 dark:border-ink-700 dark:hover:bg-ink-800">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => setPage((p) => Math.min(maxPage, p + 1))} disabled={page >= maxPage} aria-label="Next" className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 hover:bg-ink-100 disabled:opacity-40 dark:border-ink-700 dark:hover:bg-ink-800">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[3/4] skeleton rounded-2xl" />)
          : view.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
      </div>
    </section>
  );
}

function PromoCard({ title, sub, cta, to, image, tone }: { title: string; sub: string; cta: string; to: string; image: string; tone: 'dark' | 'brand' | 'gold' }) {
  const toneCls =
    tone === 'dark' ? 'from-ink-900 to-ink-800 text-white' :
    tone === 'brand' ? 'from-brand-700 to-brand-900 text-white' :
    'from-gold-500 to-gold-600 text-ink-900';
  return (
    <button onClick={() => navigate(to)} className={`group relative flex h-56 overflow-hidden rounded-3xl bg-gradient-to-br ${toneCls} text-left`}>
      <img src={image} alt="" className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-30 transition-transform duration-700 group-hover:scale-110" loading="lazy" />
      <div className="relative flex h-full flex-col justify-between p-6">
        <div>
          <h3 className="font-display text-2xl font-semibold">{title}</h3>
          <p className="mt-1 max-w-[60%] text-sm opacity-90">{sub}</p>
        </div>
        <span className="link-underline flex items-center gap-1 text-sm font-semibold">{cta} <ArrowRight size={15} /></span>
      </div>
    </button>
  );
}

function TestimonialsCarousel() {
  const [idx, setIdx] = useState(0);
  const perView = 3;
  const maxIdx = Math.max(0, TESTIMONIALS.length - perView);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i >= maxIdx ? 0 : i + 1)), 5000);
    return () => clearInterval(t);
  }, [maxIdx]);
  return (
    <div className="mt-8">
      <div className="grid gap-4 md:grid-cols-3">
        {TESTIMONIALS.slice(idx, idx + perView).map((t) => (
          <figure key={t.name} className="flex flex-col gap-4 rounded-3xl border border-ink-200 bg-white p-6 shadow-soft dark:border-ink-800 dark:bg-ink-900">
            <Quote size={28} className="text-brand-500" />
            <blockquote className="flex-1 text-sm leading-relaxed text-ink-700 dark:text-ink-200">"{t.text}"</blockquote>
            <div className="flex items-center justify-between">
              <div>
                <figcaption className="text-sm font-semibold text-ink-900 dark:text-ink-100">{t.name}</figcaption>
                <p className="text-xs text-ink-400">{t.role} · {t.product}</p>
              </div>
              <div className="flex">
                {Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={14} className="text-gold-500" fill="currentColor" />)}
              </div>
            </div>
          </figure>
        ))}
      </div>
      <div className="mt-6 flex justify-center gap-1.5">
        {Array.from({ length: maxIdx + 1 }).map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} aria-label={`Testimonial ${i + 1}`} className={`h-2 rounded-full transition-all ${i === idx ? 'w-6 bg-brand-600' : 'w-2 bg-ink-300 dark:bg-ink-700'}`} />
        ))}
      </div>
    </div>
  );
}

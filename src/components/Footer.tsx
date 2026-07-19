import { useState } from 'react';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, Send, Shield, Truck, RotateCcw, Headphones } from 'lucide-react';
import { navigate } from '../lib/router';
import { useStore } from '../lib/store';

const POLICIES = [
  { label: 'Privacy Policy', to: '/policies#privacy' },
  { label: 'Terms of Service', to: '/policies#terms' },
  { label: 'Shipping Policy', to: '/policies#shipping' },
  { label: 'Returns & Refunds', to: '/policies#returns' },
  { label: 'FAQ', to: '/policies#faq' },
];

const SHOP = [
  { label: 'All products', to: '/shop' },
  { label: 'New arrivals', to: '/shop?sort=newest' },
  { label: 'Best sellers', to: '/shop?filter=best' },
  { label: 'Trending', to: '/shop?filter=trending' },
  { label: 'Deals', to: '/shop?filter=deals' },
];

const COMPANY = [
  { label: 'About us', to: '/policies#about' },
  { label: 'Track order', to: '/track' },
  { label: 'Contact', to: '/policies#contact' },
  { label: 'Admin', to: '/admin' },
];

export function Footer() {
  const { toast } = useStore();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // store newsletter sign-ups in a lightweight row via the service role is unavailable from anon;
    // we persist locally as a toast confirmation for the demo.
    setDone(true);
    toast('Subscribed! Check your inbox for a welcome offer.');
    setEmail('');
    setTimeout(() => setDone(false), 4000);
  };

  return (
    <footer className="mt-20 border-t border-ink-200 bg-ink-50 dark:border-ink-800 dark:bg-ink-950">
      {/* trust strip */}
      <div className="border-b border-ink-200 dark:border-ink-800">
        <div className="container-page grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
          {[
            { icon: Truck, title: 'Free express shipping', sub: 'On orders over $75' },
            { icon: RotateCcw, title: '30-day returns', sub: 'Hassle-free refunds' },
            { icon: Shield, title: 'Secure checkout', sub: '256-bit encryption' },
            { icon: Headphones, title: '24/7 support', sub: 'Always here to help' },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-soft dark:bg-ink-900">
                <f.icon size={20} className="text-brand-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">{f.title}</p>
                <p className="text-xs text-ink-500">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* newsletter */}
      <div className="container-page py-12">
        <div className="grid gap-8 rounded-4xl bg-ink-900 p-8 text-white md:grid-cols-2 md:items-center md:p-12 dark:bg-ink-900">
          <div>
            <h2 className="font-display text-2xl font-semibold md:text-3xl">Join the Maison list</h2>
            <p className="mt-2 text-ink-200">Get early access to new drops, member-only deals, and 10% off your first order.</p>
          </div>
          <form onSubmit={subscribe} className="flex w-full max-w-md gap-2 md:ml-auto">
            <div className="relative flex-1">
              <Mail size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email address"
                className="w-full rounded-full border border-white/20 bg-white/10 px-11 py-3 text-sm text-white placeholder:text-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/40"
              />
            </div>
            <button type="submit" className="btn-gold">
              {done ? 'Subscribed' : 'Subscribe'} <Send size={15} />
            </button>
          </form>
        </div>
      </div>

      {/* links */}
      <div className="border-t border-ink-200 dark:border-ink-800">
        <div className="container-page grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 font-display text-lg font-bold text-white">M</span>
              <span className="font-display text-xl font-semibold text-ink-900 dark:text-white">Maison</span>
            </div>
            <p className="text-sm text-ink-500">A premium marketplace for curated electronics, home, fashion and lifestyle goods.</p>
            <div className="mt-4 flex gap-2">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" aria-label="Social link" className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 text-ink-600 transition-colors hover:border-brand-600 hover:text-brand-600 dark:border-ink-700 dark:text-ink-300">
                  <Icon size={17} />
                </a>
              ))}
            </div>
          </div>
          <FooterCol title="Shop" links={SHOP} />
          <FooterCol title="Company" links={COMPANY} />
          <FooterCol title="Help" links={POLICIES} />
        </div>
      </div>

      {/* contact + bottom */}
      <div className="border-t border-ink-200 dark:border-ink-800">
        <div className="container-page flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-500">
            <span className="flex items-center gap-2"><MapPin size={15} /> 24 Market St, San Francisco, CA</span>
            <a href="tel:+18005551234" className="flex items-center gap-2 hover:text-ink-900 dark:hover:text-ink-100"><Phone size={15} /> +1 (800) 555-1234</a>
            <a href="mailto:care@maison.shop" className="flex items-center gap-2 hover:text-ink-900 dark:hover:text-ink-100"><Mail size={15} /> care@maison.shop</a>
          </div>
          <p className="text-sm text-ink-400">© {new Date().getFullYear()} Maison. Crafted with care.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-ink-900 dark:text-ink-100">{title}</h3>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <button onClick={() => navigate(l.to)} className="text-sm text-ink-500 transition-colors hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-100">
              {l.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

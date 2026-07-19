import { useEffect, useState } from 'react';
import {
  Menu, X, Search, Heart, ShoppingBag, User, Sun, Moon, GitCompare,
  ChevronDown, Package, LogOut, LayoutDashboard,
} from 'lucide-react';
import { useStore, CURRENCIES } from '../lib/store';
import { navigate, useRouter } from '../lib/router';
import { supabase } from '../lib/supabase';
import type { Category } from '../lib/types';
import { fetchCategories } from '../lib/api';
import { classNames } from '../lib/format';
import { SearchBox } from './SearchBox';
import { CartDrawer } from './CartDrawer';

// Map icon string names to lucide components for category chips.
import {
  Cpu, Headphones, Watch, Sofa, CookingPot, Shirt, Sparkles, Mountain, type LucideIcon,
} from 'lucide-react';
const ICONS: Record<string, LucideIcon> = {
  Cpu, Headphones, Watch, Sofa, CookingPot, Shirt, Sparkles, Mountain,
};

export function Header() {
  const { theme, toggleTheme, cartCount, wishlist, compare, currency, setCurrency, user } = useStore();
  const { route } = useRouter();
  const [cats, setCats] = useState<Category[]>([]);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetchCategories().then(setCats).catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
    setSearchOpen(false);
    setUserMenu(false);
  }, [route.path]);

  const topCats = cats.filter((c) => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order);
  const subCatsOf = (parent: Category) => cats.filter((c) => c.parent_id === parent.id);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserMenu(false);
    navigate('/');
  };

  return (
    <>
      {/* announcement bar */}
      <div className="bg-ink-900 text-white dark:bg-ink-950">
        <div className="container-page flex h-9 items-center justify-between text-xs">
          <p className="hidden sm:block text-ink-200">
            Free express shipping on orders over $75 · 30-day returns
          </p>
          <div className="flex items-center gap-4">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              aria-label="Currency"
              className="bg-transparent text-ink-200 outline-none [&>option]:text-ink-900"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} {c.symbol}</option>
              ))}
            </select>
            <button onClick={() => navigate('/track')} className="hidden text-ink-200 hover:text-white sm:block">Track order</button>
            <button onClick={() => navigate('/admin')} className="hidden text-ink-200 hover:text-white sm:block">Admin</button>
          </div>
        </div>
      </div>

      <header
        className={classNames(
          'sticky top-0 z-50 border-b transition-all duration-300',
          scrolled
            ? 'border-ink-200 bg-white/85 backdrop-blur-lg dark:border-ink-800 dark:bg-ink-950/85'
            : 'border-transparent bg-white dark:bg-ink-950',
        )}
      >
        <div className="container-page flex h-16 items-center gap-3">
          <button
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <button onClick={() => navigate('/')} className="flex items-center gap-2" aria-label="Maison home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 font-display text-lg font-bold text-white">M</span>
            <span className="hidden font-display text-xl font-semibold tracking-tight text-ink-900 dark:text-white sm:block">Maison</span>
          </button>

          {/* desktop nav */}
          <nav className="ml-4 hidden lg:flex" aria-label="Primary">
            <ul className="flex items-center gap-1">
              <li>
                <button
                  onClick={() => setMegaOpen((v) => !v)}
                  className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
                >
                  Shop all <ChevronDown size={15} className={classNames('transition-transform', megaOpen && 'rotate-180')} />
                </button>
              </li>
              {topCats.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => navigate(`/shop?category=${c.slug}`)}
                    className="rounded-full px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
                  >
                    {c.name}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => navigate('/shop?sort=newest')}
                  className="rounded-full px-3 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/30"
                >
                  New arrivals
                </button>
              </li>
            </ul>
          </nav>

          {/* search (desktop) */}
          <div className="ml-auto hidden max-w-md flex-1 md:block">
            <SearchBox />
          </div>

          <div className="ml-auto flex items-center gap-1 md:ml-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800 md:hidden"
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            <button
              onClick={() => navigate('/compare')}
              className="relative hidden h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800 sm:flex"
              aria-label="Compare"
            >
              <GitCompare size={19} />
              {compare.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">{compare.length}</span>
              )}
            </button>

            <button
              onClick={() => navigate('/wishlist')}
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
              aria-label="Wishlist"
            >
              <Heart size={19} />
              {wishlist.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{wishlist.length}</span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => (user ? setUserMenu((v) => !v) : navigate('/login'))}
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
                aria-label="Account"
              >
                <User size={19} />
              </button>
              {userMenu && user && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-ink-200 bg-white p-2 shadow-card animate-scale-in dark:border-ink-800 dark:bg-ink-900">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-ink-900 dark:text-ink-100">Signed in</p>
                    <p className="truncate text-xs text-ink-400">{user.email}</p>
                  </div>
                  <div className="my-1 h-px bg-ink-100 dark:bg-ink-800" />
                  <button onClick={() => navigate('/profile')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800">
                    <User size={16} /> Profile
                  </button>
                  <button onClick={() => navigate('/profile?tab=orders')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800">
                    <Package size={16} /> Orders
                  </button>
                  <button onClick={() => navigate('/admin')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800">
                    <LayoutDashboard size={16} /> Admin
                  </button>
                  <div className="my-1 h-px bg-ink-100 dark:bg-ink-800" />
                  <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setCartOpen(true)}
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
              aria-label={`Cart, ${cartCount} items`}
            >
              <ShoppingBag size={19} />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">{cartCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* mega menu */}
        {megaOpen && (
          <div
            className="absolute inset-x-0 top-full hidden border-b border-ink-200 bg-white shadow-card animate-fade-in dark:border-ink-800 dark:bg-ink-950 lg:block"
            onMouseLeave={() => setMegaOpen(false)}
          >
            <div className="container-page grid grid-cols-12 gap-6 py-8">
              <div className="col-span-9 grid grid-cols-3 gap-6">
                {topCats.slice(0, 6).map((c) => {
                  const Icon = ICONS[c.icon ?? ''] ?? Cpu;
                  const subs = subCatsOf(c);
                  return (
                    <div key={c.id}>
                      <button
                        onClick={() => navigate(`/shop?category=${c.slug}`)}
                        className="flex items-center gap-2 text-sm font-semibold text-ink-900 hover:text-brand-700 dark:text-ink-100 dark:hover:text-brand-400"
                      >
                        <Icon size={16} /> {c.name}
                      </button>
                      {subs.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {subs.map((s) => (
                            <li key={s.id}>
                              <button
                                onClick={() => navigate(`/shop?category=${s.slug}`)}
                                className="text-sm text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-100"
                              >
                                {s.name}
                              </button>
                            </li>
                          ))}
                          <li>
                            <button
                              onClick={() => navigate(`/shop?category=${c.slug}`)}
                              className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-300"
                            >
                              Shop all {c.name} →
                            </button>
                          </li>
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="col-span-3">
                <button onClick={() => { navigate('/shop?sort=newest'); setMegaOpen(false); }} className="block w-full overflow-hidden rounded-2xl text-left">
                  <div className="relative h-44 w-full">
                    <img src="https://images.pexels.com/photos/6214476/pexels-photo-6214476.jpeg?auto=compress&cs=tinysrgb&w=800" alt="New arrivals" className="h-full w-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 to-transparent" />
                    <div className="absolute bottom-3 left-3 text-white">
                      <p className="text-xs uppercase tracking-wide opacity-80">Just landed</p>
                      <p className="font-display text-lg font-semibold">New arrivals</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-white p-4 shadow-lift animate-fade-in dark:bg-ink-950">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-semibold">Menu</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={22} /></button>
            </div>
            <div className="my-4">
              <SearchBox onClose={() => setMobileOpen(false)} />
            </div>
            <nav className="space-y-1">
              <button onClick={() => navigate('/shop')} className="block w-full rounded-lg px-3 py-2.5 text-left font-medium hover:bg-ink-100 dark:hover:bg-ink-800">Shop all</button>
              {topCats.map((c) => (
                <div key={c.id}>
                  <button onClick={() => navigate(`/shop?category=${c.slug}`)} className="block w-full rounded-lg px-3 py-2.5 text-left font-medium hover:bg-ink-100 dark:hover:bg-ink-800">
                    {c.name}
                  </button>
                  {subCatsOf(c).length > 0 && (
                    <div className="ml-3 border-l border-ink-100 pl-3 dark:border-ink-800">
                      {subCatsOf(c).map((s) => (
                        <button key={s.id} onClick={() => navigate(`/shop?category=${s.slug}`)} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800">
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="my-2 h-px bg-ink-100 dark:bg-ink-800" />
              <button onClick={() => navigate('/compare')} className="block w-full rounded-lg px-3 py-2.5 text-left hover:bg-ink-100 dark:hover:bg-ink-800">Compare ({compare.length})</button>
              <button onClick={() => navigate('/track')} className="block w-full rounded-lg px-3 py-2.5 text-left hover:bg-ink-100 dark:hover:bg-ink-800">Track order</button>
              <button onClick={() => navigate('/admin')} className="block w-full rounded-lg px-3 py-2.5 text-left hover:bg-ink-100 dark:hover:bg-ink-800">Admin dashboard</button>
            </nav>
          </div>
        </div>
      )}

      {/* mobile search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          <div className="absolute inset-x-0 top-0 bg-white p-4 shadow-lift animate-fade-in dark:bg-ink-950">
            <div className="flex items-center gap-2">
              <div className="flex-1"><SearchBox onClose={() => setSearchOpen(false)} /></div>
              <button onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={22} /></button>
            </div>
          </div>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

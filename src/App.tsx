import { useEffect } from 'react';
import { StoreProvider, useStore } from './lib/store';
import { useRouter, matchPath, navigate } from './lib/router';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LiveChat } from './components/LiveChat';
import { Toaster } from './components/Toaster';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';
import { WishlistPage } from './pages/WishlistPage';
import { ComparePage } from './pages/ComparePage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { PoliciesPage } from './pages/PoliciesPage';

function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="font-display text-6xl font-bold text-ink-200 dark:text-ink-800">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-ink-500">The page you are looking for doesn't exist or has moved.</p>
      <button onClick={() => navigate('/')} className="btn-primary mt-6">Back home</button>
    </div>
  );
}

function Routed() {
  const { route } = useRouter();
  const { user } = useStore();
  const path = route.path;

  // admin has its own chrome (no storefront header/footer)
  if (path === '/admin') return <AdminPage />;

  let page: React.ReactNode = null;
  if (path === '/' || path === '') page = <HomePage />;
  else if (path === '/shop') page = <ShopPage />;
  else {
    const m = matchPath('/product/:slug', path);
    if (m) { page = <ProductPage />; }
  }
  if (path === '/cart') page = <CartPage />;
  else if (path === '/wishlist') page = <WishlistPage />;
  else if (path === '/compare') page = <ComparePage />;
  else if (path === '/checkout') page = <CheckoutPage />;
  else if (path === '/login') page = <AuthPage mode="login" />;
  else if (path === '/register') page = <AuthPage mode="register" />;
  else if (path === '/profile') page = user ? <ProfilePage /> : <AuthPage mode="login" />;
  else if (path === '/track') page = <TrackOrderPage />;
  else if (path === '/policies') page = <PoliciesPage />;

  // order confirmation /order/:id
  const om = matchPath('/order/:id', path);
  if (om) page = <OrderConfirmationPage />;

  if (!page) page = <NotFound />;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{page}</main>
      <Footer />
      <LiveChat />
      <Toaster />
    </div>
  );
}

function App() {
  // Ensure there's a default route hash
  useEffect(() => {
    if (!window.location.hash) window.location.hash = '/';
  }, []);

  // Scroll to top on route changes (except when we have hash anchors like #faq)
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash;
      if (h && !h.startsWith('#/') && h.startsWith('#')) {
        // anchor link — let it scroll naturally
        return;
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <StoreProvider>
      <Routed />
    </StoreProvider>
  );
}

export default App;

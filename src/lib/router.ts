import { useEffect, useState, useCallback } from 'react';

// Minimal hash-based router. Routes look like #/path?query=value
export type Route = {
  path: string; // e.g. "/shop", "/product/:slug"
  query: Record<string, string>;
  params: Record<string, string>;
};

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, queryString] = raw.split('?');
  const query: Record<string, string> = {};
  if (queryString) {
    new URLSearchParams(queryString).forEach((v, k) => (query[k] = v));
  }
  return { path: path || '/', query, params: {} };
}

export function navigate(to: string) {
  if (window.location.hash === `#${to}`) {
    // force re-render even if same hash
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = to;
  }
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(parseHash);
  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const push = useCallback((to: string) => navigate(to), []);
  return { route, push };
}

// Match a route pattern like "/product/:slug" against an actual path "/product/foo".
export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const pp = pattern.split('/').filter(Boolean);
  const ap = path.split('/').filter(Boolean);
  if (pp.length !== ap.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) {
      params[pp[i].slice(1)] = decodeURIComponent(ap[i]);
    } else if (pp[i] !== ap[i]) {
      return null;
    }
  }
  return params;
}

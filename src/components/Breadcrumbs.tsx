import { ChevronRight, Home } from 'lucide-react';
import { navigate } from '../lib/router';

type Crumb = { label: string; to?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-ink-500 dark:text-ink-400">
      <button onClick={() => navigate('/')} className="flex items-center hover:text-ink-900 dark:hover:text-ink-100" aria-label="Home">
        <Home size={14} />
      </button>
      {items.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight size={14} className="text-ink-300" />
          {c.to ? (
            <button onClick={() => navigate(c.to!)} className="hover:text-ink-900 dark:hover:text-ink-100">{c.label}</button>
          ) : (
            <span className="font-medium text-ink-900 dark:text-ink-100">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

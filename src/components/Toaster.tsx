import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useStore } from '../lib/store';
import { classNames } from '../lib/format';

export function Toaster() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={classNames(
            'pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-card animate-scale-in dark:bg-ink-900',
            t.kind === 'error' ? 'border-rose-300 dark:border-rose-800' : 'border-ink-200 dark:border-ink-800',
          )}
        >
          {t.kind === 'error' ? (
            <XCircle size={18} className="text-rose-500" />
          ) : t.kind === 'info' ? (
            <Info size={18} className="text-ink-500" />
          ) : (
            <CheckCircle2 size={18} className="text-brand-500" />
          )}
          <p className="flex-1 text-sm text-ink-800 dark:text-ink-100">{t.message}</p>
          <button onClick={() => dismissToast(t.id)} aria-label="Dismiss" className="text-ink-400 hover:text-ink-700">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

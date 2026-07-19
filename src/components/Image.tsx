import { useState, type ImgHTMLAttributes } from 'react';
import { classNames } from '../lib/format';

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  ratio?: string; // e.g. "aspect-[4/5]"
  sizes?: string;
};

// Lazy-loaded image with skeleton placeholder and graceful fallback.
export function Image({ src, alt, ratio = 'aspect-square', className, ...rest }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  return (
    <div className={classNames('relative overflow-hidden bg-ink-100 dark:bg-ink-800', ratio, className)}>
      {!loaded && !errored && <div className="skeleton absolute inset-0" aria-hidden />}
      {errored ? (
        <div className="absolute inset-0 flex items-center justify-center text-ink-400">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={classNames(
            'h-full w-full object-cover transition-all duration-700',
            loaded ? 'scale-100 opacity-100 blur-0' : 'scale-105 opacity-0 blur-md',
          )}
          {...rest}
        />
      )}
    </div>
  );
}

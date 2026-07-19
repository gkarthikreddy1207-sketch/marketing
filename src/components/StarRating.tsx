import { Star } from 'lucide-react';
import { classNames } from '../lib/format';

export function StarRating({
  rating,
  size = 14,
  showValue = false,
  className,
}: {
  rating: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className={classNames('inline-flex items-center gap-1', className)}>
      <span className="flex" aria-label={`${rating} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < full;
          const isHalf = i === full && half;
          return (
            <Star
              key={i}
              size={size}
              className={classNames(
                filled || isHalf ? 'text-gold-500' : 'text-ink-300 dark:text-ink-600',
              )}
              fill={filled ? 'currentColor' : isHalf ? 'url(#half)' : 'none'}
              strokeWidth={1.5}
            />
          );
        })}
      </span>
      {showValue && <span className="text-xs font-medium text-ink-500 dark:text-ink-400">{rating.toFixed(1)}</span>}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="half">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}

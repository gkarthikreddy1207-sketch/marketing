import type { Currency } from './types';

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', label: 'US Dollar', rate: 1 },
  { code: 'EUR', symbol: '€', label: 'Euro', rate: 0.92 },
  { code: 'GBP', symbol: '£', label: 'British Pound', rate: 0.79 },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen', rate: 157 },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee', rate: 83.4 },
];

export function getCurrency(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

// Format a cents value (in USD base) into the active currency string.
export function formatPrice(centsUSD: number, currencyCode = 'USD'): string {
  const c = getCurrency(currencyCode);
  const converted = (centsUSD / 100) * c.rate;
  const decimals = c.code === 'JPY' ? 0 : 2;
  const value = converted.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${c.symbol}${value}`;
}

export function discountPercent(price: number, compareAt: number | null): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function classNames(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

export function generateOrderNumber(): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MA-${t}-${r}`;
}

export const SHIPPING_FLAT_CENTS = 1200; // $12 flat
export const SHIPPING_FREE_THRESHOLD_CENTS = 7500; // free over $75
export const TAX_RATE = 0.08; // 8% estimate

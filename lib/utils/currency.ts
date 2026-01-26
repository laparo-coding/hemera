/**
 * Currency Utilities
 *
 * Centralized currency constants and helpers.
 * Default currency is EUR per project guidelines.
 */

/** Default currency code (uppercase for storage/display) */
export const DEFAULT_CURRENCY = 'EUR';

/** Default amount in cents (for free/unpriced items) */
export const DEFAULT_AMOUNT = 0;

/**
 * Price info with defaults applied
 */
export interface PriceInfo {
  amount: number;
  currency: string;
}

/**
 * Normalize price with defaults
 * @param amount - Price in cents (may be null/undefined)
 * @param currency - Currency code (may be null/undefined)
 * @returns Normalized price info with defaults applied
 */
export function normalizePrice(
  amount: number | null | undefined,
  currency: string | null | undefined
): PriceInfo {
  return {
    amount: amount ?? DEFAULT_AMOUNT,
    currency: currency || DEFAULT_CURRENCY,
  };
}

/**
 * Get currency for Stripe API (lowercase)
 * Stripe requires lowercase currency codes
 */
export function getStripeCurrency(currency?: string | null): string {
  return (currency || DEFAULT_CURRENCY).toLowerCase();
}

/**
 * Ensure currency is uppercase for storage/display
 */
export function normalizeCurrency(currency?: string | null): string {
  return (currency || DEFAULT_CURRENCY).toUpperCase();
}

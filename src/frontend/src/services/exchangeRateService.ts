/**
 * exchangeRateService — Live USDC/ZAR rate via the backend canister.
 * Mirrors the pattern of coinGeckoService.ts (ICP price).
 * The actual HTTP outcall is backend-side (actor.getUSDCZARRate()).
 * This service handles parsing and module-level caching.
 */

export interface USDCRateData {
  zarPerUsdc: number;
  fetchedAt: number; // ms timestamp
  isLive: boolean; // false = fallback constant used
}

const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const FALLBACK_RATE = 18.5;

let _cached: USDCRateData | null = null;

/**
 * Parse the raw JSON text from actor.getUSDCZARRate()
 * Expected format: {"usd-coin":{"zar":18.52}}
 */
export function parseUSDCZARRaw(raw: string): USDCRateData | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // CoinGecko response shape
    const rate = parsed["usd-coin"]?.zar;
    if (typeof rate !== "number" || rate <= 0) return null;
    return { zarPerUsdc: rate, fetchedAt: Date.now(), isLive: true };
  } catch {
    return null;
  }
}

/**
 * Return cached rate if still fresh, otherwise null.
 */
export function getCachedUSDCRate(): USDCRateData | null {
  if (!_cached) return null;
  if (Date.now() - _cached.fetchedAt > CACHE_DURATION_MS) {
    _cached = null;
    return null;
  }
  return _cached;
}

/**
 * Store parsed rate data in module cache.
 */
export function cacheUSDCRate(data: USDCRateData): void {
  _cached = data;
}

/**
 * Fallback constant when CoinGecko is unavailable.
 */
export function getFallbackRate(): USDCRateData {
  return { zarPerUsdc: FALLBACK_RATE, fetchedAt: Date.now(), isLive: false };
}

/**
 * Format the ZAR/USDC rate for display in the calculator.
 * Shows "(live)" or "(estimate)" depending on source.
 */
export function formatUSDCRate(data: USDCRateData): string {
  const rate = data.zarPerUsdc.toFixed(2);
  return data.isLive ? `R${rate} / USDC (live)` : `R${rate} / USDC (estimate)`;
}

/**
 * Human-readable "Updated X min ago" label.
 */
export function formatRateAge(fetchedAt: number): string {
  const diffMs = Date.now() - fetchedAt;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Updated just now";
  if (mins === 1) return "Updated 1 min ago";
  return `Updated ${mins} min ago`;
}

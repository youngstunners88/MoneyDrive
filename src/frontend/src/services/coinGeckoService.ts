/**
 * coinGeckoService — ICP live price fetch via the backend canister.
 * Actual HTTP outcall is via actor.getICPPrice() which calls CoinGecko server-side.
 * This service handles parsing and caching the result.
 */

export interface ICPPriceData {
  usd: number;
  usd_24h_change: number;
  fetchedAt: number; // ms timestamp
}

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

let _cached: ICPPriceData | null = null;

/**
 * Parse the raw JSON string from actor.getICPPrice()
 */
export function parseICPPriceRaw(raw: string): ICPPriceData | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const data = parsed["internet-computer"];
    if (!data || typeof data.usd !== "number") return null;
    return {
      usd: data.usd,
      usd_24h_change: data.usd_24h_change ?? 0,
      fetchedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Get cached price data if still fresh, otherwise return null to trigger a refetch.
 */
export function getCachedICPPrice(): ICPPriceData | null {
  if (!_cached) return null;
  if (Date.now() - _cached.fetchedAt > CACHE_DURATION_MS) {
    _cached = null;
    return null;
  }
  return _cached;
}

/**
 * Cache parsed price data.
 */
export function cacheICPPrice(data: ICPPriceData): void {
  _cached = data;
}

/**
 * Format ICP price for display.
 */
export function formatICPPrice(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

/**
 * Format 24h change with sign and percentage.
 */
export function format24hChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
}

import axios from 'axios';
import { COINGECKO_API_URL } from '@/utils/constants';

interface CoinGeckoPriceResponse {
  [coinId: string]: {
    usd: number;
    usd_24h_change?: number;
  };
}

/**
 * Price cache to reduce API calls
 */
const priceCache = new Map<string, { price: number; timestamp: number; change24h?: number }>();
const CACHE_DURATION = 30000; // 30 seconds

/**
 * Fetch token price from CoinGecko
 */
export async function fetchTokenPrice(
  coingeckoId: string
): Promise<{ usd: number; usd_24h_change?: number } | null> {
  try {
    // Check cache first
    const cached = priceCache.get(coingeckoId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return { usd: cached.price, usd_24h_change: cached.change24h };
    }

    const apiKey = import.meta.env.VITE_COINGECKO_API_KEY;
    const url = apiKey
      ? `${COINGECKO_API_URL}/simple/price?ids=${coingeckoId}&vs_currencies=usd&include_24hr_change=true&x_cg_pro_api_key=${apiKey}`
      : `${COINGECKO_API_URL}/simple/price?ids=${coingeckoId}&vs_currencies=usd&include_24hr_change=true`;

    const response = await axios.get<CoinGeckoPriceResponse>(url);

    const data = response.data[coingeckoId];
    if (!data) return null;

    // Cache the result
    priceCache.set(coingeckoId, {
      price: data.usd,
      change24h: data.usd_24h_change,
      timestamp: Date.now(),
    });

    return data;
  } catch (error) {
    console.error(`Error fetching price for ${coingeckoId}:`, error);
    // Return cached value if available, even if stale
    const cached = priceCache.get(coingeckoId);
    if (cached) {
      return { usd: cached.price, usd_24h_change: cached.change24h };
    }
    return null;
  }
}

/**
 * Fetch multiple token prices in a single request
 */
export async function fetchMultipleTokenPrices(
  coingeckoIds: string[]
): Promise<Map<string, { usd: number; usd_24h_change?: number }>> {
  if (coingeckoIds.length === 0) {
    return new Map();
  }

  try {
    const apiKey = import.meta.env.VITE_COINGECKO_API_KEY;
    const ids = coingeckoIds.join(',');
    const url = apiKey
      ? `${COINGECKO_API_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&x_cg_pro_api_key=${apiKey}`
      : `${COINGECKO_API_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

    const response = await axios.get<CoinGeckoPriceResponse>(url);

    const result = new Map<string, { usd: number; usd_24h_change?: number }>();

    Object.entries(response.data).forEach(([coinId, data]) => {
      result.set(coinId, {
        usd: data.usd,
        usd_24h_change: data.usd_24h_change,
      });

      // Cache individual prices
      priceCache.set(coinId, {
        price: data.usd,
        change24h: data.usd_24h_change,
        timestamp: Date.now(),
      });
    });

    return result;
  } catch (error) {
    console.error('Error fetching multiple token prices:', error);
    return new Map();
  }
}

/**
 * Clear price cache
 */
export function clearPriceCache() {
  priceCache.clear();
}

/**
 * Get cached price without making a request
 */
export function getCachedPrice(coingeckoId: string): number | null {
  const cached = priceCache.get(coingeckoId);
  return cached ? cached.price : null;
}

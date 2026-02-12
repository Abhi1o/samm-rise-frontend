import axios from 'axios';
import { COINGECKO_API_URL, COINCAP_API_URL, CRYPTOCOMPARE_API_URL, BINANCE_API_URL } from '@/utils/constants';

interface CoinGeckoPriceResponse {
  [coinId: string]: {
    usd: number;
    usd_24h_change?: number;
  };
}

interface CoinCapAsset {
  id: string;
  symbol: string;
  priceUsd: string;
  changePercent24Hr?: string;
}

interface CoinCapResponse {
  data: CoinCapAsset;
}

interface CryptoCompareResponse {
  USD?: number;
}

// Mapping from CoinGecko IDs to CoinCap IDs
const COINGECKO_TO_COINCAP: { [key: string]: string } = {
  'tether': 'tether',
  'usd-coin': 'usd-coin',
  'dai': 'multi-collateral-dai',
  'ethereum': 'ethereum',
  'weth': 'wrapped-ether',
  'wrapped-bitcoin': 'wrapped-bitcoin',
  'bitcoin': 'bitcoin',
  'binancecoin': 'binance-coin',
  'matic-network': 'polygon',
  'wmatic': 'polygon',
  'chainlink': 'chainlink',
  'uniswap': 'uniswap',
  'aave': 'aave',
  'arbitrum': 'arbitrum',
  'optimism': 'optimism',
};

// Mapping from CoinGecko IDs to CryptoCompare symbols
const COINGECKO_TO_CRYPTOCOMPARE: { [key: string]: string } = {
  'tether': 'USDT',
  'usd-coin': 'USDC',
  'dai': 'DAI',
  'ethereum': 'ETH',
  'weth': 'WETH',
  'wrapped-bitcoin': 'WBTC',
  'bitcoin': 'BTC',
  'binancecoin': 'BNB',
  'matic-network': 'MATIC',
  'wmatic': 'WMATIC',
  'chainlink': 'LINK',
  'uniswap': 'UNI',
  'aave': 'AAVE',
  'arbitrum': 'ARB',
  'optimism': 'OP',
};

// Mapping from CoinGecko IDs to Binance trading pairs (vs USDT)
const COINGECKO_TO_BINANCE: { [key: string]: string } = {
  'tether': 'USDTUSD', // Special case - USDT price in USD
  'usd-coin': 'USDCUSDT',
  'dai': 'DAIUSDT',
  'ethereum': 'ETHUSDT',
  'weth': 'ETHUSDT', // WETH tracks ETH price
  'wrapped-bitcoin': 'BTCUSDT', // WBTC tracks BTC price
  'bitcoin': 'BTCUSDT',
  'binancecoin': 'BNBUSDT',
  'matic-network': 'MATICUSDT',
  'wmatic': 'MATICUSDT', // WMATIC tracks MATIC price
  'chainlink': 'LINKUSDT',
  'uniswap': 'UNIUSDT',
  'aave': 'AAVEUSDT',
  'arbitrum': 'ARBUSDT',
  'optimism': 'OPUSDT',
};

/**
 * Price cache to reduce API calls
 */
const priceCache = new Map<string, { price: number; timestamp: number; change24h?: number }>();
const CACHE_DURATION = 30000; // 30 seconds

/**
 * Fetch price from CoinCap API (fallback #1)
 */
async function fetchFromCoinCap(coingeckoId: string): Promise<{ usd: number; usd_24h_change?: number } | null> {
  try {
    const coinCapId = COINGECKO_TO_COINCAP[coingeckoId];
    if (!coinCapId) {
      console.log(`No CoinCap mapping for ${coingeckoId}`);
      return null;
    }

    const response = await axios.get<CoinCapResponse>(`${COINCAP_API_URL}/assets/${coinCapId}`);
    const data = response.data.data;

    if (!data || !data.priceUsd) return null;

    return {
      usd: parseFloat(data.priceUsd),
      usd_24h_change: data.changePercent24Hr ? parseFloat(data.changePercent24Hr) : undefined,
    };
  } catch (error) {
    console.error(`CoinCap API error for ${coingeckoId}:`, error);
    return null;
  }
}

/**
 * Fetch price from CryptoCompare API (fallback #2)
 */
async function fetchFromCryptoCompare(coingeckoId: string): Promise<{ usd: number; usd_24h_change?: number } | null> {
  try {
    const symbol = COINGECKO_TO_CRYPTOCOMPARE[coingeckoId];
    if (!symbol) {
      console.log(`No CryptoCompare mapping for ${coingeckoId}`);
      return null;
    }

    const response = await axios.get<CryptoCompareResponse>(
      `${CRYPTOCOMPARE_API_URL}/price?fsym=${symbol}&tsyms=USD`
    );

    if (!response.data.USD) return null;

    return {
      usd: response.data.USD,
      usd_24h_change: undefined, // CryptoCompare free tier doesn't include 24h change
    };
  } catch (error) {
    console.error(`CryptoCompare API error for ${coingeckoId}:`, error);
    return null;
  }
}

/**
 * Fetch price from Binance API (fallback #3)
 */
async function fetchFromBinance(coingeckoId: string): Promise<{ usd: number; usd_24h_change?: number } | null> {
  try {
    const symbol = COINGECKO_TO_BINANCE[coingeckoId];
    if (!symbol) {
      console.log(`No Binance mapping for ${coingeckoId}`);
      return null;
    }

    // For stablecoins like USDT, return 1.0 directly
    if (coingeckoId === 'tether' || coingeckoId === 'usd-coin') {
      return { usd: 1.0, usd_24h_change: 0 };
    }

    // Get 24h ticker data which includes price and change
    const response = await axios.get(`${BINANCE_API_URL}/ticker/24hr?symbol=${symbol}`);

    if (!response.data.lastPrice) return null;

    return {
      usd: parseFloat(response.data.lastPrice),
      usd_24h_change: response.data.priceChangePercent ? parseFloat(response.data.priceChangePercent) : undefined,
    };
  } catch (error) {
    console.error(`Binance API error for ${coingeckoId}:`, error);
    return null;
  }
}

/**
 * Fetch token price from CoinGecko with fallbacks
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

    // Try CoinGecko first
    try {
      const apiKey = import.meta.env.VITE_COINGECKO_API_KEY;
      const url = apiKey
        ? `${COINGECKO_API_URL}/simple/price?ids=${coingeckoId}&vs_currencies=usd&include_24hr_change=true&x_cg_pro_api_key=${apiKey}`
        : `${COINGECKO_API_URL}/simple/price?ids=${coingeckoId}&vs_currencies=usd&include_24hr_change=true`;

      const response = await axios.get<CoinGeckoPriceResponse>(url);

      const data = response.data[coingeckoId];
      if (data) {
        // Cache the result
        priceCache.set(coingeckoId, {
          price: data.usd,
          change24h: data.usd_24h_change,
          timestamp: Date.now(),
        });

        return data;
      }
    } catch (error: any) {
      console.warn(`CoinGecko API failed for ${coingeckoId} (${error?.response?.status || 'unknown error'}), trying fallbacks...`);
    }

    // Fallback #1: Try Binance (excellent CORS support, free, no API key)
    console.log(`Trying Binance for ${coingeckoId}...`);
    const binancePrice = await fetchFromBinance(coingeckoId);
    if (binancePrice) {
      // Cache the result
      priceCache.set(coingeckoId, {
        price: binancePrice.usd,
        change24h: binancePrice.usd_24h_change,
        timestamp: Date.now(),
      });
      return binancePrice;
    }

    // Fallback #2: Try CryptoCompare (good CORS support)
    console.log(`Trying CryptoCompare for ${coingeckoId}...`);
    const cryptoComparePrice = await fetchFromCryptoCompare(coingeckoId);
    if (cryptoComparePrice) {
      // Cache the result
      priceCache.set(coingeckoId, {
        price: cryptoComparePrice.usd,
        change24h: cryptoComparePrice.usd_24h_change,
        timestamp: Date.now(),
      });
      return cryptoComparePrice;
    }

    // Fallback #3: Try CoinCap (may have CORS issues in browser)
    console.log(`Trying CoinCap for ${coingeckoId}...`);
    const coinCapPrice = await fetchFromCoinCap(coingeckoId);
    if (coinCapPrice) {
      // Cache the result
      priceCache.set(coingeckoId, {
        price: coinCapPrice.usd,
        change24h: coinCapPrice.usd_24h_change,
        timestamp: Date.now(),
      });
      return coinCapPrice;
    }

    // Return stale cached value if all APIs fail
    const staleCache = priceCache.get(coingeckoId);
    if (staleCache) {
      console.log(`Using stale cache for ${coingeckoId}`);
      return { usd: staleCache.price, usd_24h_change: staleCache.change24h };
    }

    return null;
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
 * Fetch multiple token prices in a single request with fallbacks
 */
export async function fetchMultipleTokenPrices(
  coingeckoIds: string[]
): Promise<Map<string, { usd: number; usd_24h_change?: number }>> {
  if (coingeckoIds.length === 0) {
    return new Map();
  }

  const result = new Map<string, { usd: number; usd_24h_change?: number }>();

  // Try CoinGecko first
  try {
    const apiKey = import.meta.env.VITE_COINGECKO_API_KEY;
    const ids = coingeckoIds.join(',');
    const url = apiKey
      ? `${COINGECKO_API_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&x_cg_pro_api_key=${apiKey}`
      : `${COINGECKO_API_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

    const response = await axios.get<CoinGeckoPriceResponse>(url);

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

    // If we got all prices, return
    if (result.size === coingeckoIds.length) {
      return result;
    }
  } catch (error: any) {
    console.warn(`CoinGecko batch API failed (${error?.response?.status || 'unknown error'}), falling back to individual requests...`);
  }

  // For missing prices or if CoinGecko failed, try fallback APIs individually
  const missingIds = coingeckoIds.filter(id => !result.has(id));

  for (const coinId of missingIds) {
    const price = await fetchTokenPrice(coinId);
    if (price) {
      result.set(coinId, price);
    }
  }

  return result;
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

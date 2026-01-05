import { useQuery } from '@tanstack/react-query';
import { Token } from '@/types/tokens';
import { fetchMultipleTokenPrices } from '@/services/priceService';
import { PRICE_REFRESH_INTERVAL } from '@/utils/constants';

/**
 * Hook to fetch prices for multiple tokens efficiently
 */
export function useTokenPrices(tokens: Token[]) {
  const coingeckoIds = tokens
    .map((t) => t.coingeckoId)
    .filter((id): id is string => !!id);

  const { data, isLoading, error } = useQuery({
    queryKey: ['tokenPrices', coingeckoIds.sort().join(',')],
    queryFn: () => fetchMultipleTokenPrices(coingeckoIds),
    enabled: coingeckoIds.length > 0,
    refetchInterval: PRICE_REFRESH_INTERVAL,
    staleTime: PRICE_REFRESH_INTERVAL,
  });

  // Create a map of token symbol to price
  const priceMap = new Map<string, { usd: number; usd_24h_change?: number }>();

  if (data) {
    tokens.forEach((token) => {
      if (token.coingeckoId) {
        const priceData = data.get(token.coingeckoId);
        if (priceData) {
          priceMap.set(token.symbol, priceData);
        }
      }
    });
  }

  /**
   * Get price for a specific token symbol
   */
  const getPrice = (symbol: string): number => {
    return priceMap.get(symbol)?.usd || 0;
  };

  /**
   * Get 24h price change for a specific token symbol
   */
  const getPriceChange = (symbol: string): number | undefined => {
    return priceMap.get(symbol)?.usd_24h_change;
  };

  return {
    prices: priceMap,
    getPrice,
    getPriceChange,
    isLoading,
    error,
  };
}

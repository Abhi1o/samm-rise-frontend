import { useQuery } from '@tanstack/react-query';
import { Token } from '@/types/tokens';
import { fetchTokenPrice } from '@/services/priceService';
import { PRICE_REFRESH_INTERVAL } from '@/utils/constants';

/**
 * Hook to fetch token price from CoinGecko
 */
export function useTokenPrice(token?: Token) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tokenPrice', token?.coingeckoId],
    queryFn: () => {
      if (!token?.coingeckoId) return null;
      return fetchTokenPrice(token.coingeckoId);
    },
    enabled: !!token?.coingeckoId,
    refetchInterval: PRICE_REFRESH_INTERVAL,
    staleTime: PRICE_REFRESH_INTERVAL,
  });

  return {
    price: data?.usd || 0,
    priceChange24h: data?.usd_24h_change,
    isLoading,
    error,
  };
}

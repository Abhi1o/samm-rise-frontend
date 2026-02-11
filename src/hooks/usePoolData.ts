import { useQuery } from '@tanstack/react-query';
import { sammApi, ShardInfo } from '@/services/sammApi';
import { useChainId } from 'wagmi';
import { getChainName } from '@/config/chains';

interface Pool extends ShardInfo {
  id: string;
  pairName: string;
}

/**
 * Hook to fetch pool/shard data from the backend
 */
export function usePoolData() {
  const chainId = useChainId();
  const chainName = getChainName(chainId);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['pools', chainId],
    queryFn: async () => {
      try {
        // Use the new getPools() endpoint
        return await sammApi.getPools();
      } catch (err) {
        console.error('Failed to fetch pools:', err);
        throw err;
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Transform pools data to flat array format
  const pools: Pool[] = data?.pools
    ? data.pools.flatMap((poolGroup) =>
        poolGroup.shards.map((shard) => ({
          ...shard,
          id: shard.address,
          pairName: poolGroup.pair,
        }))
      )
    : [];

  return {
    pools,
    totalShards: pools.length,
    chainId,
    chainName,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch statistics for a specific pool
 * Note: This endpoint is not available in the current backend
 * Use the pools data from usePoolData instead
 */
export function usePoolStats(poolAddress: string) {
  const chainId = useChainId();
  const chainName = getChainName(chainId);

  return useQuery({
    queryKey: ['poolStats', poolAddress],
    queryFn: async () => {
      // This endpoint doesn't exist in the new backend
      // Return mock data or fetch from pools endpoint
      throw new Error('Pool stats endpoint not available');
    },
    enabled: false, // Disabled until backend implements this
    refetchInterval: 60000,
    staleTime: 60000,
    retry: 0,
  });
}

/**
 * Hook to fetch detailed pool data with statistics
 * Uses the same getPools() endpoint as usePoolData
 */
export function useDetailedPoolData() {
  const chainId = useChainId();
  const chainName = getChainName(chainId);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['detailedPools', chainId],
    queryFn: async () => {
      // Use the same getPools() endpoint
      return await sammApi.getPools();
    },
    refetchInterval: 30000,
    staleTime: 30000,
    retry: 2,
  });

  // Transform pools data to flat array format
  const pools = data?.pools
    ? data.pools.flatMap((poolGroup) =>
        poolGroup.shards.map((shard) => ({
          ...shard,
          id: shard.address,
          pairName: poolGroup.pair,
        }))
      )
    : [];

  return {
    pools,
    totalShards: pools.length,
    totalTVL: '0', // Calculate from pools if needed
    chainId,
    chainName,
    isLoading,
    error,
    refetch,
  };
}

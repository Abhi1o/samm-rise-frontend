import { useQuery } from '@tanstack/react-query';
import { sammApi, ShardInfo, PoolStats } from '@/services/sammApi';
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
  const chainName = getChainName(chainId).toLowerCase().replace(' ', '');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['pools', chainName, chainId],
    queryFn: async () => {
      try {
        return await sammApi.getShards(chainName);
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

  // Transform shards to pool format
  const pools: Pool[] = data
    ? Object.entries(data.shards).flatMap(([pairName, shards]) =>
        shards.map((shard) => ({
          ...shard,
          id: shard.address,
          pairName,
        }))
      )
    : [];

  return {
    pools,
    totalShards: data?.totalShards || 0,
    chainId: data?.chainId || chainId,
    chainName: data?.chain || chainName,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch statistics for a specific pool
 */
export function usePoolStats(poolAddress: string) {
  const chainId = useChainId();
  const chainName = getChainName(chainId).toLowerCase().replace(' ', '');

  return useQuery({
    queryKey: ['poolStats', chainName, poolAddress],
    queryFn: () => sammApi.getPoolStats(chainName, poolAddress),
    enabled: !!poolAddress,
    refetchInterval: 60000, // Refresh every minute
    staleTime: 60000,
    retry: 2,
  });
}

/**
 * Hook to fetch detailed pool data with statistics
 */
export function useDetailedPoolData() {
  const chainId = useChainId();
  const chainName = getChainName(chainId).toLowerCase().replace(' ', '');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['detailedPools', chainName, chainId],
    queryFn: () => sammApi.getDetailedShards(chainName),
    refetchInterval: 30000,
    staleTime: 30000,
    retry: 2,
  });

  // Transform detailed shards to pool format
  const pools = data
    ? Object.entries(data.shards).flatMap(([pairName, shards]) =>
        shards.map((shard) => ({
          ...shard,
          id: shard.address,
          pairName,
        }))
      )
    : [];

  return {
    pools,
    totalShards: data?.totalShards || 0,
    totalTVL: data?.totalTVL || '0',
    chainId: data?.chainId || chainId,
    chainName: data?.chain || chainName,
    isLoading,
    error,
    refetch,
  };
}

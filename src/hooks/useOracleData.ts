import { useQuery } from '@tanstack/react-query';
import { sammApi } from '@/services/sammApi';
import type { OracleComparisonResult } from '@/types/oracle';

export function useOracleData() {
  return useQuery<OracleComparisonResult>({
    queryKey: ['oracle-chainlink'],
    queryFn: () => sammApi.getOracleComparison(),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 25_000,
    retry: 1,
  });
}

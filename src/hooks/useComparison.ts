import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sammApi } from '@/services/sammApi';
import type { ComparisonResult, MatrixResult } from '@/types/comparison';

interface ComparisonParams {
  tokenIn: string;
  tokenOut: string;
  amount: string;
}

export function useComparison() {
  const [params, setParams] = useState<ComparisonParams | null>(null);

  const query = useQuery<ComparisonResult>({
    queryKey: ['comparison', params?.tokenIn, params?.tokenOut, params?.amount],
    queryFn: () => sammApi.getComparison(params!.tokenIn, params!.tokenOut, params!.amount),
    enabled: !!params && !!params.tokenIn && !!params.tokenOut && !!params.amount,
    staleTime: 10_000,
    retry: 1,
  });

  // Stable reference — safe to use as a useEffect dependency
  const fetchComparison = useCallback((p: ComparisonParams) => setParams(p), []);

  return {
    ...query,
    fetchComparison,
    params,
  };
}

export function useComparisonMatrix() {
  return useQuery<MatrixResult>({
    queryKey: ['comparison-matrix'],
    queryFn: () => sammApi.getComparisonMatrix(),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useSwapCardComparison(
  tokenIn: string | undefined,
  tokenOut: string | undefined,
  amount: string | undefined
) {
  return useQuery<ComparisonResult>({
    queryKey: ['comparison-badge', tokenIn, tokenOut, amount],
    queryFn: () => sammApi.getComparison(tokenIn!, tokenOut!, amount!),
    enabled: !!tokenIn && !!tokenOut && !!amount && parseFloat(amount) > 0,
    staleTime: 15_000,
    retry: 0,
  });
}

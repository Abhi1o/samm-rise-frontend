import { useMemo } from 'react';
import { useGasPrice } from 'wagmi';
import { formatEther } from 'viem';

interface UseGasEstimationParams {
  enabled?: boolean;
}

interface UseGasEstimationReturn {
  estimatedGas: bigint;
  estimatedCostInEth: string;
  isEstimating: boolean;
  error: Error | undefined;
}

// Gas estimates based on actual testing
const GAS_ESTIMATES = {
  CREATE_SHARD: 2_600_000n,
  INITIALIZE_SHARD: 490_000n,
  APPROVE: 50_000n,
  BUFFER_PERCENT: 20n, // 20% buffer
};

/**
 * Hook to estimate gas cost for pool creation transactions
 * Includes createShard, initializeShard, and 20% buffer
 */
export function useGasEstimation({
  enabled = true,
}: UseGasEstimationParams = {}): UseGasEstimationReturn {
  const { data: gasPrice, isLoading, error } = useGasPrice({
    query: {
      enabled,
    },
  });

  const { estimatedGas, estimatedCostInEth } = useMemo(() => {
    // Total gas needed (create + initialize)
    const totalGas = GAS_ESTIMATES.CREATE_SHARD + GAS_ESTIMATES.INITIALIZE_SHARD;
    
    // Add 20% buffer for safety
    const gasWithBuffer = totalGas + (totalGas * GAS_ESTIMATES.BUFFER_PERCENT) / 100n;

    // Calculate cost in ETH
    const currentGasPrice = gasPrice || 0n;
    const costInWei = gasWithBuffer * currentGasPrice;
    const costInEth = formatEther(costInWei);

    return {
      estimatedGas: gasWithBuffer,
      estimatedCostInEth: costInEth,
    };
  }, [gasPrice]);

  return {
    estimatedGas,
    estimatedCostInEth,
    isEstimating: isLoading,
    error: error as Error | undefined,
  };
}

import { useReadContract } from 'wagmi';
import { Address } from 'viem';
import { SAMMPoolFactoryABI } from '@/config/abis';

interface UsePoolExistenceParams {
  token0Address: Address | undefined;
  token1Address: Address | undefined;
  factoryAddress: Address | undefined;
  enabled?: boolean;
}

interface UsePoolExistenceReturn {
  poolExists: boolean;
  poolAddress: Address | undefined;
  isChecking: boolean;
  error: Error | undefined;
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;

/**
 * Hook to check if a pool already exists for a token pair
 * Calls factory's getShard function and checks if address is non-zero
 */
export function usePoolExistence({
  token0Address,
  token1Address,
  factoryAddress,
  enabled = true,
}: UsePoolExistenceParams): UsePoolExistenceReturn {
  const {
    data: poolAddress,
    isLoading,
    error,
  } = useReadContract({
    address: factoryAddress,
    abi: SAMMPoolFactoryABI,
    functionName: 'getShard',
    args: token0Address && token1Address ? [token0Address, token1Address] : undefined,
    query: {
      enabled: enabled && !!factoryAddress && !!token0Address && !!token1Address,
    },
  });

  const currentPoolAddress = (poolAddress as Address) || ZERO_ADDRESS;
  const poolExists = currentPoolAddress !== ZERO_ADDRESS;

  return {
    poolExists,
    poolAddress: poolExists ? currentPoolAddress : undefined,
    isChecking: isLoading,
    error: error as Error | undefined,
  };
}

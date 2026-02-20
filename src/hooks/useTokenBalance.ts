import { useReadContract } from 'wagmi';
import { Address, formatUnits } from 'viem';
import { ERC20_ABI } from '@/utils/constants';

interface UseTokenBalanceParams {
  tokenAddress: Address | undefined;
  userAddress: Address | undefined;
  enabled?: boolean;
}

interface UseTokenBalanceReturn {
  balance: bigint;
  formattedBalance: string;
  isLoading: boolean;
  error: Error | undefined;
  refetch: () => void;
}

/**
 * Hook to fetch and watch ERC20 token balance for a user
 * Auto-refetches on block changes
 */
export function useTokenBalance({
  tokenAddress,
  userAddress,
  enabled = true,
}: UseTokenBalanceParams): UseTokenBalanceReturn {
  const {
    data: balance,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: enabled && !!tokenAddress && !!userAddress,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Get token decimals for formatting
  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
      enabled: enabled && !!tokenAddress,
    },
  });

  const currentBalance = (balance as bigint) || 0n;
  const tokenDecimals = (decimals as number) || 18;
  const formattedBalance = formatUnits(currentBalance, tokenDecimals);

  return {
    balance: currentBalance,
    formattedBalance,
    isLoading,
    error: error as Error | undefined,
    refetch,
  };
}

import { useBalance } from 'wagmi';
import { useAccount } from 'wagmi';

/**
 * Hook to get native ETH balance for the connected wallet
 * @returns balance in wei, formatted balance, and loading state
 */
export function useNativeBalance() {
  const { address } = useAccount();
  
  const { data, isLoading, refetch } = useBalance({
    address,
    query: {
      enabled: !!address,
    },
  });

  return {
    balance: data?.value || 0n,
    balanceFormatted: data?.formatted || '0',
    symbol: data?.symbol || 'ETH',
    decimals: data?.decimals || 18,
    isLoading,
    refetch,
  };
}

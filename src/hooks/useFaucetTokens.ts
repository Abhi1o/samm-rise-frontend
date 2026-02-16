import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { TokenFaucetABI, TOKEN_FAUCET_ADDRESS } from '@/config/abis/TokenFaucet';
import { riseChain } from '@/config/chains';

interface FaucetToken {
  address: string;
  symbol: string;
  amountPerRequest: string; // Formatted amount
  decimals: number;
}

/**
 * Hook to fetch available tokens from the faucet contract
 * Shows what tokens and amounts users will receive
 */
export function useFaucetTokens() {
  const { data: tokensData, isLoading, error } = useReadContract({
    address: TOKEN_FAUCET_ADDRESS,
    abi: TokenFaucetABI,
    functionName: 'getAllTokens',
    chainId: riseChain.id,
    query: {
      refetchInterval: 60000, // Refetch every minute
    },
  });

  // Parse and format token data
  const tokens: FaucetToken[] = tokensData
    ? tokensData.map((token: any) => ({
        address: token.tokenAddress,
        symbol: token.symbol,
        amountPerRequest: formatUnits(token.amountPerRequest, token.decimals),
        decimals: token.decimals,
      }))
    : [];

  return {
    tokens,
    isLoading,
    error,
    hasTokens: tokens.length > 0,
  };
}

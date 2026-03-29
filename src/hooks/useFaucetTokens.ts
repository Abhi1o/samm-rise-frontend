import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { TokenFaucetABI, TOKEN_FAUCET_ADDRESS } from '@/config/abis/TokenFaucet';
import { commonTokens } from '@/config/tokens';
import { riseChain } from '@/config/chains';

interface FaucetToken {
  address: string;
  symbol: string;
  amountPerRequest: string; // Human-readable formatted amount
  decimals: number;
}

// Address → known decimals from our local token registry (source of truth)
const decimalsMap: Record<string, number> = Object.fromEntries(
  (commonTokens[riseChain.id] ?? []).map((t) => [t.address.toLowerCase(), t.decimals])
);

/**
 * Hook to fetch available tokens from the faucet contract.
 * Uses TokenFaucetABI which correctly returns amountPerRequest for all tokens.
 * Decimals are resolved from our local commonTokens registry (not the contract)
 * to avoid ABI mismatch issues with the decimals field.
 */
export function useFaucetTokens() {
  const { data: tokensData, isLoading, error } = useReadContract({
    address: TOKEN_FAUCET_ADDRESS,
    abi: TokenFaucetABI,
    functionName: 'getAllTokens',
    chainId: riseChain.id,
    query: {
      refetchInterval: 60000,
    },
  });

  const tokens: FaucetToken[] = tokensData
    ? (tokensData as any[]).map((token) => {
        const addr = (token.tokenAddress as string).toLowerCase();
        // Use known decimals from config; fall back to 18 if unknown
        const decimals = decimalsMap[addr] ?? 18;
        return {
          address: token.tokenAddress as string,
          symbol: token.symbol as string,
          amountPerRequest: formatUnits(token.amountPerRequest as bigint, decimals),
          decimals,
        };
      })
    : [];

  return {
    tokens,
    isLoading,
    error,
    hasTokens: tokens.length > 0,
  };
}

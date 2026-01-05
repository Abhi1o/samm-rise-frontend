import { useAccount, useChainId } from 'wagmi';
import { Token, TokenBalance } from '@/types/tokens';
import { useTokenBalance } from './useTokenBalance';
import { useTokenPrice } from './useTokenPrice';
import { formatTokenAmount, formatUSD } from '@/utils/formatters';

/**
 * Hook to fetch balances for multiple tokens
 * Note: This creates individual queries for each token
 * For production, consider using multicall for better performance
 */
export function useTokenBalances(tokens: Token[]) {
  const { address } = useAccount();
  const chainId = useChainId();

  // Filter tokens for current chain
  const chainTokens = tokens.filter((t) => t.chainId === chainId);

  const balances: TokenBalance[] = chainTokens.map((token) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { balanceFormatted, balanceBigInt, isLoading: balanceLoading } = useTokenBalance(token);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { price, isLoading: priceLoading } = useTokenPrice(token);

    const balanceNum = parseFloat(balanceFormatted || '0');
    const usdValue = balanceNum * price;

    return {
      token,
      balance: balanceBigInt.toString(),
      balanceFormatted: formatTokenAmount(balanceBigInt, token.decimals),
      usdValue: formatUSD(usdValue),
      isLoading: balanceLoading || priceLoading,
    };
  }) as any;

  // Sort by USD value (highest first)
  const sortedBalances = balances.sort((a: TokenBalance, b: TokenBalance) => {
    const aValue = parseFloat(a.usdValue?.replace(/[$,]/g, '') || '0');
    const bValue = parseFloat(b.usdValue?.replace(/[$,]/g, '') || '0');
    return bValue - aValue;
  });

  return {
    balances: sortedBalances,
    isLoading: balances.some((b: TokenBalance) => (b as any).isLoading),
    hasBalance: balances.some((b: TokenBalance) => parseFloat(b.balanceFormatted) > 0),
  };
}

import { useAccount, useReadContracts, useChainId } from 'wagmi';
import { Address, formatUnits } from 'viem';
import { useMemo } from 'react';
import { useUserPositions } from './useUserPositions';
import { useTokenPrices } from './useTokenPrices';
import { getTokensForChain, isNativeToken } from '@/config/tokens';
import { ERC20_ABI } from '@/utils/constants';
import { PortfolioData, TokenBalanceWithValue, LPPositionWithValue } from '@/types/portfolio';

/**
 * Hook to aggregate complete portfolio data for the connected wallet
 * Fetches token balances, LP positions, and calculates total USD values
 */
export function usePortfolioData(): PortfolioData {
  const { address: walletAddress } = useAccount();
  const chainId = useChainId();

  // Get all tokens for current chain
  const tokens = useMemo(() => getTokensForChain(chainId), [chainId]);

  // Get LP positions using existing hook
  const { positions: lpPositions, isLoading: lpLoading } = useUserPositions();

  // Fetch prices for all tokens
  const { getPrice, getPriceChange, isLoading: pricesLoading } = useTokenPrices(tokens);

  // Prepare contracts for batch balance reading (ERC20 tokens only, exclude native)
  const balanceContracts = useMemo(() => {
    if (!walletAddress) return [];

    return tokens
      .filter(token => !isNativeToken(token.address))
      .map(token => ({
        address: token.address as Address,
        abi: ERC20_ABI,
        functionName: 'balanceOf' as const,
        args: [walletAddress] as const,
      }));
  }, [walletAddress, tokens]);

  // Batch read all ERC20 token balances
  const { data: balancesData, isLoading: balancesLoading, error } = useReadContracts({
    contracts: balanceContracts,
    query: {
      enabled: !!walletAddress && balanceContracts.length > 0,
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 30000,
    },
  });

  // Process token balances with USD values
  const tokenBalances = useMemo((): TokenBalanceWithValue[] => {
    if (!walletAddress || !balancesData) return [];

    const erc20Tokens = tokens.filter(token => !isNativeToken(token.address));
    const balances: TokenBalanceWithValue[] = [];

    balancesData.forEach((result, index) => {
      const token = erc20Tokens[index];
      if (!token || result.status !== 'success') return;

      const balanceBigInt = result.result as bigint;

      // Skip zero balances
      if (balanceBigInt === 0n) return;

      const balanceFormatted = formatUnits(balanceBigInt, token.decimals);
      const balanceNumber = parseFloat(balanceFormatted);
      const priceUSD = getPrice(token.symbol);
      const valueUSD = balanceNumber * priceUSD;
      const priceChange24h = getPriceChange(token.symbol);

      balances.push({
        token,
        balance: balanceBigInt.toString(),
        balanceFormatted: balanceNumber.toFixed(6).replace(/\.?0+$/, ''),
        priceUSD,
        valueUSD,
        priceChange24h,
      });
    });

    // Sort by USD value (highest first)
    return balances.sort((a, b) => b.valueUSD - a.valueUSD);
  }, [walletAddress, balancesData, tokens, getPrice, getPriceChange]);

  // Process LP positions with USD values
  const lpPositionsWithValue = useMemo((): LPPositionWithValue[] => {
    if (!lpPositions.length) return [];

    return lpPositions.map(position => {
      // Get token objects to access decimals
      const token0 = tokens.find(t => t.symbol === position.token0Symbol);
      const token1 = tokens.find(t => t.symbol === position.token1Symbol);

      // Parse amounts (they're in wei/smallest unit)
      const token0Amount = token0
        ? parseFloat(formatUnits(BigInt(position.token0Amount), token0.decimals))
        : 0;
      const token1Amount = token1
        ? parseFloat(formatUnits(BigInt(position.token1Amount), token1.decimals))
        : 0;

      // Calculate USD values
      const token0Price = getPrice(position.token0Symbol);
      const token1Price = getPrice(position.token1Symbol);
      const token0ValueUSD = token0Amount * token0Price;
      const token1ValueUSD = token1Amount * token1Price;
      const totalValueUSD = token0ValueUSD + token1ValueUSD;

      return {
        ...position,
        token0ValueUSD,
        token1ValueUSD,
        totalValueUSD,
      };
    });
  }, [lpPositions, tokens, getPrice]);

  // Calculate total portfolio value
  const totalValueUSD = useMemo(() => {
    const tokensValue = tokenBalances.reduce((sum, tb) => sum + tb.valueUSD, 0);
    const lpValue = lpPositionsWithValue.reduce((sum, lp) => sum + lp.totalValueUSD, 0);
    return tokensValue + lpValue;
  }, [tokenBalances, lpPositionsWithValue]);

  const isLoading = balancesLoading || lpLoading || pricesLoading;

  return {
    totalValueUSD,
    tokenBalances,
    lpPositions: lpPositionsWithValue,
    isLoading,
    error,
  };
}

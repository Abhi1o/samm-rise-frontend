import { useAccount, useReadContracts } from 'wagmi';
import { Address, parseAbi } from 'viem';
import { usePoolData } from './usePoolData';
import { useMemo } from 'react';

// Simple ABI for the functions we need
const POOL_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function getPoolState() view returns ((address tokenA, address tokenB, uint256 reserveA, uint256 reserveB, uint256 totalSupply, uint256 tradeFeeNumerator, uint256 tradeFeeDenominator, uint256 ownerFeeNumerator, uint256 ownerFeeDenominator))',
]);

export interface UserPosition {
  poolAddress: Address;
  poolName: string;
  pairName: string;
  lpBalance: bigint;
  lpBalanceFormatted: string;
  shareOfPool: number;
  token0Amount: string;
  token1Amount: string;
  token0Symbol: string;
  token1Symbol: string;
}

/**
 * Hook to fetch user's liquidity positions across all pools
 */
export function useUserPositions() {
  const { address: userAddress } = useAccount();
  const { pools, isLoading: poolsLoading } = usePoolData();

  // Prepare contracts for batch reading
  const contracts = useMemo(() => {
    if (!userAddress || !pools.length) return [];

    return pools.flatMap((pool) => [
      // Get LP token balance
      {
        address: pool.address as Address,
        abi: POOL_ABI,
        functionName: 'balanceOf',
        args: [userAddress] as const,
      },
      // Get total supply
      {
        address: pool.address as Address,
        abi: POOL_ABI,
        functionName: 'totalSupply',
        args: [] as const,
      },
      // Get pool state for reserves
      {
        address: pool.address as Address,
        abi: POOL_ABI,
        functionName: 'getPoolState',
        args: [] as const,
      },
    ]);
  }, [userAddress, pools]);

  // Batch read all data
  const { data: contractsData, isLoading: contractsLoading, refetch, error: contractsError } = useReadContracts({
    contracts,
    query: {
      enabled: !!userAddress && pools.length > 0,
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });

  // Log errors for debugging
  if (contractsError) {
    console.error('[useUserPositions] Contract read error:', contractsError);
  }

  // Process the data into user positions
  const positions = useMemo(() => {
    if (!contractsData || !pools.length || !userAddress) {
      return [];
    }

    const userPositions: UserPosition[] = [];

    // Process data in groups of 3 (balance, totalSupply, poolState)
    for (let i = 0; i < pools.length; i++) {
      const pool = pools[i];
      const baseIndex = i * 3;

      const balanceResult = contractsData[baseIndex];
      const totalSupplyResult = contractsData[baseIndex + 1];
      const poolStateResult = contractsData[baseIndex + 2];

      // Skip if any data is missing or errored
      if (
        balanceResult?.status !== 'success' ||
        totalSupplyResult?.status !== 'success' ||
        poolStateResult?.status !== 'success'
      ) {
        continue;
      }

      // Type guards for results
      const lpBalanceRaw = balanceResult.result;
      const totalSupplyRaw = totalSupplyResult.result;
      const poolStateRaw = poolStateResult.result;
      
      // Skip if wrong types
      if (
        typeof lpBalanceRaw !== 'bigint' ||
        typeof totalSupplyRaw !== 'bigint' ||
        typeof poolStateRaw === 'string' ||
        Array.isArray(poolStateRaw)
      ) {
        continue;
      }
      
      const lpBalance = lpBalanceRaw;
      const totalSupply = totalSupplyRaw;
      const poolState = poolStateRaw as {
        tokenA: Address;
        tokenB: Address;
        reserveA: bigint;
        reserveB: bigint;
        totalSupply: bigint;
        tradeFeeNumerator: bigint;
        tradeFeeDenominator: bigint;
        ownerFeeNumerator: bigint;
        ownerFeeDenominator: bigint;
      };

      // Skip if user has no balance
      if (lpBalance === 0n) continue;

      // Calculate share of pool
      const shareOfPool = totalSupply > 0n 
        ? Number((lpBalance * 10000n) / totalSupply) / 100 
        : 0;

      // Calculate token amounts based on share
      const reserveA = poolState.reserveA;
      const reserveB = poolState.reserveB;

      const token0Amount = totalSupply > 0n
        ? ((reserveA * lpBalance) / totalSupply).toString()
        : '0';
      
      const token1Amount = totalSupply > 0n
        ? ((reserveB * lpBalance) / totalSupply).toString()
        : '0';

      // Format LP balance (18 decimals)
      const lpBalanceFormatted = (Number(lpBalance) / 1e18).toFixed(6);

      const [token0Symbol, token1Symbol] = pool.pairName.split('-');

      userPositions.push({
        poolAddress: pool.address as Address,
        poolName: pool.name,
        pairName: pool.pairName,
        lpBalance,
        lpBalanceFormatted,
        shareOfPool,
        token0Amount,
        token1Amount,
        token0Symbol,
        token1Symbol,
      });
    }

    return userPositions;
  }, [contractsData, pools, userAddress]);

  return {
    positions,
    isLoading: poolsLoading || contractsLoading,
    hasPositions: positions.length > 0,
    refetch,
  };
}

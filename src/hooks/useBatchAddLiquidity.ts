import { useState, useCallback, useMemo } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { Address, parseUnits } from 'viem';
import { useTokenApproval } from './useTokenApproval';
import { useAddLiquidity } from './useAddLiquidity';
import { BatchLiquidityStep, ProgressStep, UseBatchAddLiquidityReturn } from '@/types/batch';
import { Token } from '@/types/tokens';
import { SAMMPoolABI } from '@/config/abis';

interface UseBatchAddLiquidityParams {
  poolAddress?: Address;
  poolTokenA?: Address; // Pool's canonical tokenA address from getReserves
  poolTokenB?: Address; // Pool's canonical tokenB address from getReserves
  token0?: Token;
  token1?: Token;
  amount0?: string;
  amount1?: string;
  amount0Min?: string;
  amount1Min?: string;
}

/**
 * Batch add liquidity hook that orchestrates token0 approval + token1 approval + add liquidity
 * in a single user action. Follows industrial standards for multi-step transaction flows.
 */
export function useBatchAddLiquidity(params: UseBatchAddLiquidityParams): UseBatchAddLiquidityReturn {
  const { address, chainId } = useAccount();
  const [currentStep, setCurrentStep] = useState<BatchLiquidityStep>('idle');
  const [error, setError] = useState<Error | undefined>();

  // Convert string amounts to bigint for token approvals
  const amount0Needed = useMemo(() => {
    if (!params.amount0 || !params.token0?.decimals) return 0n;
    try {
      return parseUnits(params.amount0, params.token0.decimals);
    } catch {
      return 0n;
    }
  }, [params.amount0, params.token0?.decimals]);

  const amount1Needed = useMemo(() => {
    if (!params.amount1 || !params.token1?.decimals) return 0n;
    try {
      return parseUnits(params.amount1, params.token1.decimals);
    } catch {
      return 0n;
    }
  }, [params.amount1, params.token1?.decimals]);

  // Token approvals
  const token0Approval = useTokenApproval({
    tokenAddress: params.token0?.address as Address,
    spenderAddress: params.poolAddress,
    amountNeeded: amount0Needed,
    enabled: !!params.token0 && !!params.poolAddress && !!params.amount0,
  });

  const token1Approval = useTokenApproval({
    tokenAddress: params.token1?.address as Address,
    spenderAddress: params.poolAddress,
    amountNeeded: amount1Needed,
    enabled: !!params.token1 && !!params.poolAddress && !!params.amount1,
  });

  // Add liquidity hook
  const { addLiquidity, isLoading: isAddingLiquidity, hash: addLiquidityHash } = useAddLiquidity();

  /**
   * Build progress steps
   */
  const steps: ProgressStep[] = useMemo(() => {
    const stepsList: ProgressStep[] = [];

    // Token0 approval step
    if (token0Approval.needsApproval) {
      stepsList.push({
        label: `Approve ${params.token0?.symbol || 'Token0'}`,
        status:
          currentStep === 'idle' || currentStep === 'checking'
            ? 'pending'
            : currentStep === 'approving_token0'
            ? 'active'
            : ['approved_token0', 'approving_token1', 'approved_token1', 'adding_liquidity', 'success'].includes(currentStep)
            ? 'complete'
            : currentStep === 'error'
            ? 'error'
            : 'pending',
        hash: token0Approval.approvalHash,
      });
    }

    // Token1 approval step
    if (token1Approval.needsApproval) {
      stepsList.push({
        label: `Approve ${params.token1?.symbol || 'Token1'}`,
        status:
          currentStep === 'idle' || currentStep === 'checking' || currentStep === 'approving_token0' || currentStep === 'approved_token0'
            ? 'pending'
            : currentStep === 'approving_token1'
            ? 'active'
            : ['approved_token1', 'adding_liquidity', 'success'].includes(currentStep)
            ? 'complete'
            : currentStep === 'error'
            ? 'error'
            : 'pending',
        hash: token1Approval.approvalHash,
      });
    }

    // Add liquidity step
    stepsList.push({
      label: 'Add Liquidity',
      status:
        currentStep === 'adding_liquidity'
          ? 'active'
          : currentStep === 'success'
          ? 'complete'
          : currentStep === 'error'
          ? 'error'
          : 'pending',
      hash: addLiquidityHash,
    });

    return stepsList;
  }, [currentStep, token0Approval, token1Approval, params.token0, params.token1, addLiquidityHash]);

  /**
   * Execute batch add liquidity
   */
  const executeBatchAddLiquidity = useCallback(async () => {
    if (!address || !params.poolAddress) {
      throw new Error('Missing required parameters');
    }

    if (!params.token0 || !params.token1 || !params.amount0 || !params.amount1) {
      throw new Error('Missing token or amount parameters');
    }

    try {
      setError(undefined);
      setCurrentStep('checking');

      // Step 1: Approve token0 if needed
      if (token0Approval.needsApproval) {
        setCurrentStep('approving_token0');
        await token0Approval.approveToken();
        setCurrentStep('approved_token0');
      }

      // Step 2: Approve token1 if needed
      if (token1Approval.needsApproval) {
        setCurrentStep('approving_token1');
        await token1Approval.approveToken();
        setCurrentStep('approved_token1');
      }

      // Step 3: Add liquidity
      setCurrentStep('adding_liquidity');

      // CRITICAL: Reorder tokens to match pool's canonical tokenA/tokenB order
      // The pool contract expects tokens in a specific order (tokenA, tokenB)
      // which may not match the UI selection order (token0, token1)
      let tokenA: Address, tokenB: Address;
      let amountADesired: string, amountBDesired: string;
      let amountAMin: string, amountBMin: string;
      let decimalsA: number, decimalsB: number;

      if (params.poolTokenA && params.poolTokenB) {
        // Pool has tokenA and tokenB addresses (from getReserves)
        const poolTokenAAddr = params.poolTokenA.toLowerCase();
        const poolTokenBAddr = params.poolTokenB.toLowerCase();
        const uiToken0Addr = params.token0.address.toLowerCase();
        const uiToken1Addr = params.token1.address.toLowerCase();

        console.log('[useBatchAddLiquidity] Token ordering:', {
          poolTokenA: poolTokenAAddr,
          poolTokenB: poolTokenBAddr,
          uiToken0: uiToken0Addr,
          uiToken0Symbol: params.token0.symbol,
          uiToken1: uiToken1Addr,
          uiToken1Symbol: params.token1.symbol,
        });

        // Match UI tokens to pool's canonical order
        if (poolTokenAAddr === uiToken0Addr && poolTokenBAddr === uiToken1Addr) {
          // UI order matches pool order
          tokenA = params.token0.address as Address;
          tokenB = params.token1.address as Address;
          amountADesired = params.amount0;
          amountBDesired = params.amount1;
          amountAMin = params.amount0Min || '0';
          amountBMin = params.amount1Min || '0';
          decimalsA = params.token0.decimals;
          decimalsB = params.token1.decimals;
          console.log('[useBatchAddLiquidity] ✓ UI order matches pool order');
        } else if (poolTokenAAddr === uiToken1Addr && poolTokenBAddr === uiToken0Addr) {
          // UI order is reversed from pool order - need to swap
          tokenA = params.token1.address as Address;
          tokenB = params.token0.address as Address;
          amountADesired = params.amount1;
          amountBDesired = params.amount0;
          amountAMin = params.amount1Min || '0';
          amountBMin = params.amount0Min || '0';
          decimalsA = params.token1.decimals;
          decimalsB = params.token0.decimals;
          console.log('[useBatchAddLiquidity] ⚠️ Swapping token order to match pool');
        } else {
          throw new Error(`Selected tokens (${params.token0.symbol}, ${params.token1.symbol}) do not match pool tokens`);
        }
      } else {
        // Fallback: use UI order if pool tokens not available
        console.warn('[useBatchAddLiquidity] ⚠️ Pool tokens not available, using UI order');
        tokenA = params.token0.address as Address;
        tokenB = params.token1.address as Address;
        amountADesired = params.amount0;
        amountBDesired = params.amount1;
        amountAMin = params.amount0Min || '0';
        amountBMin = params.amount1Min || '0';
        decimalsA = params.token0.decimals;
        decimalsB = params.token1.decimals;
      }

      await addLiquidity({
        poolAddress: params.poolAddress,
        tokenA,
        tokenB,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        decimalsA,
        decimalsB,
      });

      setCurrentStep('success');
    } catch (err: any) {
      console.error('[useBatchAddLiquidity] Error:', err);
      setError(err);
      setCurrentStep('error');
      throw err;
    }
  }, [address, params, token0Approval, token1Approval, addLiquidity]);

  const reset = useCallback(() => {
    setCurrentStep('idle');
    setError(undefined);
  }, []);

  const isLoading = token0Approval.isApproving || token1Approval.isApproving || isAddingLiquidity;

  return {
    executeBatchAddLiquidity,
    currentStep,
    steps,
    isLoading,
    error,
    reset,
  };
}

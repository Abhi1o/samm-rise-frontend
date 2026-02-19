import { useState, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Address, parseUnits } from 'viem';
import { useTokenApproval } from './useTokenApproval';
import { useSwapExecution } from './useSwapExecution';
import { BatchSwapStep, ProgressStep, UseBatchSwapReturn } from '@/types/batch';
import { Token } from '@/types/tokens';
import { getCrossPoolRouter } from '@/config/contracts';

interface UseBatchSwapParams {
  fromToken?: Token;
  toToken?: Token;
  amountIn?: string;
  amountOut?: string;
  fromDecimals?: number;
  toDecimals?: number;
  quoteData?: any;
  slippageBps?: number;
  deadline?: number;
}

/**
 * Batch swap hook that orchestrates approval + swap in a single user action
 * Follows industrial standards for multi-step transaction flows
 */
export function useBatchSwap(params: UseBatchSwapParams): UseBatchSwapReturn {
  const { address, chainId } = useAccount();
  const [currentStep, setCurrentStep] = useState<BatchSwapStep>('idle');
  const [error, setError] = useState<Error | undefined>();

  // Get router address for approvals
  const routerAddress = chainId ? getCrossPoolRouter(chainId) : undefined;

  // Convert amountIn string to bigint for the allowance check.
  // quoteData.amountIn is a formatted decimal (e.g. "11.255641").
  // useTokenApproval approves MAX_UINT256 by default, so any positive
  // amountNeeded triggers an approval when the current allowance is 0.
  const amountNeeded = useMemo(() => {
    if (!params.amountIn || !params.fromDecimals) return 0n;
    try {
      return parseUnits(params.amountIn, params.fromDecimals);
    } catch {
      return 0n;
    }
  }, [params.amountIn, params.fromDecimals]);

  // Token approval hook
  const {
    needsApproval,
    approveToken,
    isApproving,
    approvalHash,
  } = useTokenApproval({
    tokenAddress: params.fromToken?.address as Address,
    spenderAddress: routerAddress,
    amountNeeded,
    enabled: !!params.fromToken && !!routerAddress && !!params.amountIn,
  });

  // Swap execution hook
  const { executeSwap, swapState, txHash: swapHash } = useSwapExecution();

  /**
   * Build progress steps for UI display
   */
  const steps: ProgressStep[] = useMemo(() => {
    const stepsList: ProgressStep[] = [];

    if (needsApproval) {
      stepsList.push({
        label: `Approve ${params.fromToken?.symbol || 'Token'}`,
        status:
          currentStep === 'checking' || currentStep === 'idle'
            ? 'pending'
            : currentStep === 'approving'
            ? 'active'
            : currentStep === 'approved' ||
              currentStep === 'swapping' ||
              currentStep === 'success'
            ? 'complete'
            : currentStep === 'error'
            ? 'error'
            : 'pending',
        hash: approvalHash,
      });
    }

    stepsList.push({
      label: `Swap ${params.fromToken?.symbol} → ${params.toToken?.symbol}`,
      status:
        currentStep === 'idle' || currentStep === 'checking' || currentStep === 'approving' || currentStep === 'approved'
          ? 'pending'
          : currentStep === 'swapping'
          ? 'active'
          : currentStep === 'success'
          ? 'complete'
          : currentStep === 'error'
          ? 'error'
          : 'pending',
      hash: swapHash,
    });

    return stepsList;
  }, [currentStep, needsApproval, params.fromToken, params.toToken, approvalHash, swapHash]);

  /**
   * Execute batch swap: approval (if needed) + swap
   */
  const executeBatchSwap = useCallback(async () => {
    if (!address || !chainId) {
      throw new Error('Wallet not connected');
    }

    if (!params.fromToken || !params.toToken || !params.amountIn || !params.amountOut || !params.quoteData) {
      throw new Error('Missing required swap parameters');
    }

    try {
      setError(undefined);
      setCurrentStep('checking');

      // Step 1: Approve if needed
      if (needsApproval) {
        setCurrentStep('approving');
        await approveToken(); // This will throw if user rejects
        setCurrentStep('approved');
      }

      // Step 2: Execute swap
      setCurrentStep('swapping');
      await executeSwap({
        fromToken: params.fromToken.address as Address,
        toToken: params.toToken.address as Address,
        amountIn: params.amountIn,
        amountOut: params.amountOut,
        fromDecimals: params.fromDecimals!,
        toDecimals: params.toDecimals!,
        quoteData: params.quoteData,
        slippageBps: params.slippageBps,
        deadline: params.deadline,
      });

      setCurrentStep('success');
    } catch (err: any) {
      console.error('[useBatchSwap] Error:', err);
      setError(err);
      setCurrentStep('error');
      throw err;
    }
  }, [
    address,
    chainId,
    params,
    needsApproval,
    approveToken,
    executeSwap,
  ]);

  const reset = useCallback(() => {
    setCurrentStep('idle');
    setError(undefined);
  }, []);

  const isLoading = isApproving || swapState !== 'idle';

  return {
    executeBatchSwap,
    currentStep,
    steps,
    isLoading,
    error,
    reset,
  };
}

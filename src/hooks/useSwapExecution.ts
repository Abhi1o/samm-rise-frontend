import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { Address } from 'viem';
import { CROSS_POOL_ROUTER_ABI } from '@/config/abis';
import { getCrossPoolRouter } from '@/config/contracts';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_DEADLINE, DEFAULT_SLIPPAGE } from '@/utils/constants';

export type SwapState = 'idle' | 'preparing' | 'signing' | 'confirming' | 'success' | 'error';

interface SwapParams {
  fromToken: Address;
  toToken: Address;
  amountIn: string;
  amountOut: string;
  fromDecimals: number;
  toDecimals: number;
  quoteData: any;
  slippageBps?: number; // In basis points (50 = 0.5%)
  deadline?: number; // In minutes
  recipient?: Address;
}

interface UseSwapExecutionReturn {
  executeSwap: (params: SwapParams) => Promise<void>;
  swapState: SwapState;
  isLoading: boolean;
  txHash: Address | undefined;
  reset: () => void;
}

/**
 * Hook for executing swaps via CrossPoolRouter contract
 * Handles both direct swaps and multi-hop swaps
 */
export function useSwapExecution(): UseSwapExecutionReturn {
  const { toast } = useToast();
  const { address: userAddress } = useAccount();
  const chainId = useChainId();
  const [swapState, setSwapState] = useState<SwapState>('idle');

  // Write contract for swap
  const {
    writeContract: swap,
    data: swapHash,
    isPending: isSwapPending,
    error: swapError,
    reset: resetSwap,
  } = useWriteContract();

  // Wait for swap transaction
  const {
    isLoading: isSwapConfirming,
    isSuccess: isSwapSuccess,
    error: swapReceiptError,
  } = useWaitForTransactionReceipt({
    hash: swapHash,
  });

  const isLoading = isSwapPending || isSwapConfirming;

  /**
   * Build swap path from quote data
   */
  const buildSwapPath = useCallback(
    (params: SwapParams) => {
      const { fromToken, toToken, amountOut, toDecimals, quoteData, slippageBps, deadline, recipient } = params;

      const hops: {
        tokenIn: Address;
        tokenOut: Address;
        amountOut: bigint;
      }[] = [];

      // Parse exact amount out
      const exactAmountOut = BigInt(Math.floor(parseFloat(amountOut) * Math.pow(10, toDecimals)));

      // Check if it's a direct swap or multi-hop
      if ('bestShard' in quoteData) {
        // Direct swap (single hop)
        hops.push({
          tokenIn: fromToken,
          tokenOut: toToken,
          amountOut: exactAmountOut,
        });
      } else if ('steps' in quoteData) {
        // Multi-hop swap
        for (const step of quoteData.steps) {
          hops.push({
            tokenIn: step.from as Address,
            tokenOut: step.to as Address,
            amountOut: BigInt(step.amountOut),
          });
        }
      } else {
        throw new Error('Invalid quote data format');
      }

      // Calculate maxAmountIn with slippage
      const slippage = slippageBps || DEFAULT_SLIPPAGE * 100; // Convert to bps
      const baseAmountIn =
        'bestShard' in quoteData
          ? BigInt(quoteData.bestShard.amountIn)
          : BigInt(quoteData.amountIn);

      const maxAmountIn = baseAmountIn + (baseAmountIn * BigInt(slippage)) / 10000n;

      // Calculate deadline (current timestamp + minutes)
      const deadlineMinutes = deadline || DEFAULT_DEADLINE;
      const deadlineTimestamp = BigInt(Math.floor(Date.now() / 1000) + deadlineMinutes * 60);

      return {
        hops,
        maxAmountIn,
        deadline: deadlineTimestamp,
        recipient: recipient || userAddress!,
      };
    },
    [userAddress]
  );

  /**
   * Execute swap transaction with retry logic
   */
  const executeSwap = useCallback(
    async (params: SwapParams) => {
      if (!userAddress) {
        throw new Error('Wallet not connected');
      }

      try {
        setSwapState('preparing');

        // Get router address for current chain
        const routerAddress = getCrossPoolRouter(chainId);

        // Build swap parameters
        const swapParams = buildSwapPath(params);

        console.log('Executing swap:', {
          router: routerAddress,
          hops: swapParams.hops,
          maxAmountIn: swapParams.maxAmountIn.toString(),
          deadline: swapParams.deadline.toString(),
          recipient: swapParams.recipient,
        });

        setSwapState('signing');

        // Execute swap
        await swap({
          address: routerAddress,
          abi: CROSS_POOL_ROUTER_ABI,
          functionName: 'swapExactOutput',
          args: [swapParams],
        });

        setSwapState('confirming');

        toast({
          title: 'Transaction Submitted',
          description: 'Waiting for confirmation...',
        });
      } catch (error: any) {
        console.error('Swap execution failed:', error);
        setSwapState('error');

        toast({
          title: 'Swap Failed',
          description: error.message || 'Failed to execute swap',
          variant: 'destructive',
        });

        throw error;
      }
    },
    [userAddress, chainId, buildSwapPath, swap, toast]
  );

  // Update state based on transaction status
  const updateState = useCallback(() => {
    if (isSwapPending) {
      setSwapState('signing');
    } else if (isSwapConfirming) {
      setSwapState('confirming');
    } else if (isSwapSuccess) {
      setSwapState('success');
      toast({
        title: 'Swap Successful!',
        description: 'Your transaction has been confirmed',
      });
    } else if (swapError || swapReceiptError) {
      setSwapState('error');
      const errorMessage = swapError?.message || swapReceiptError?.message || 'Transaction failed';
      toast({
        title: 'Swap Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [isSwapPending, isSwapConfirming, isSwapSuccess, swapError, swapReceiptError, toast]);

  // Auto-update state
  useState(() => {
    updateState();
  });

  const reset = () => {
    resetSwap();
    setSwapState('idle');
  };

  return {
    executeSwap,
    swapState,
    isLoading,
    txHash: swapHash,
    reset,
  };
}

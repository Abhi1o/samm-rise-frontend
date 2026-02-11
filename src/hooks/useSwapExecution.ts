import { useState, useCallback, useEffect, useRef } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
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
  const { address: userAddress, chainId } = useAccount();
  const [swapState, setSwapState] = useState<SwapState>('idle');
  const submittedToastShown = useRef<string | null>(null);
  const successToastShown = useRef<string | null>(null);

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
   * 
   * The contract uses swapExactOutput, which means:
   * - We specify the exact amountOut we want for each hop
   * - The contract calculates the required amountIn
   * - We provide maxAmountIn as a slippage protection
   * 
   * IMPORTANT: We need to add MORE slippage because the backend's amountIn
   * is just an estimate. The actual required input might be higher.
   */
  const buildSwapPath = useCallback(
    (params: SwapParams) => {
      const { fromToken, toToken, fromDecimals, quoteData, slippageBps, deadline, recipient } = params;

      const hops: {
        tokenIn: Address;
        tokenOut: Address;
        amountOut: bigint;
      }[] = [];

      // Both direct and multi-hop swaps now use the 'steps' format
      if ('steps' in quoteData && quoteData.steps && quoteData.steps.length > 0) {
        // Use steps from quote data (works for both direct and multi-hop)
        for (const step of quoteData.steps) {
          hops.push({
            tokenIn: step.fromAddress as Address,
            tokenOut: step.toAddress as Address,
            amountOut: BigInt(step.amountOut),
          });
        }
      } else if ('bestShard' in quoteData) {
        // Fallback for old bestShard format (shouldn't happen with updated backend)
        hops.push({
          tokenIn: fromToken,
          tokenOut: toToken,
          amountOut: BigInt(quoteData.bestShard.amountOut),
        });
      } else {
        throw new Error('Invalid quote data format - missing steps');
      }

      // Calculate maxAmountIn with slippage
      // CRITICAL: For swapExactOutput, we need higher slippage because:
      // 1. Backend calculates max output for given input (forward: input → max output)
      // 2. Contract calculates required input for exact output (reverse: output → required input)
      // 3. Due to SAMM curve non-linearity, these calculations don't match exactly
      // 4. The contract may need MORE input than the backend's estimate to guarantee the output
      const slippage = slippageBps || DEFAULT_SLIPPAGE * 100; // Convert to bps
      
      // Convert amountIn from decimal string to BigInt wei
      // quoteData.amountIn is a formatted decimal like "11.255641"
      // We need to convert it to wei using the fromToken decimals
      const amountInDecimal = parseFloat(quoteData.amountIn);
      const baseAmountIn = BigInt(Math.floor(amountInDecimal * Math.pow(10, fromDecimals)));
      
      // Use 5% extra slippage to handle the forward/reverse calculation mismatch
      // This ensures the contract has enough input allowance to achieve the desired output
      const extraSlippage = 500; // 5% in basis points
      const totalSlippage = slippage + extraSlippage;
      
      const maxAmountIn = baseAmountIn + (baseAmountIn * BigInt(totalSlippage)) / 10000n;

      console.log('Swap path calculation:', {
        baseAmountIn: baseAmountIn.toString(),
        slippage: `${slippage / 100}%`,
        extraSlippage: `${extraSlippage / 100}%`,
        totalSlippage: `${totalSlippage / 100}%`,
        maxAmountIn: maxAmountIn.toString(),
        quoteDataAmountIn: quoteData.amountIn,
        quoteDataAmountOut: quoteData.amountOut,
        hops: hops.map(h => ({
          tokenIn: h.tokenIn,
          tokenOut: h.tokenOut,
          amountOut: h.amountOut.toString()
        }))
      });

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
      if (!userAddress || !chainId) {
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

        console.log('Calling swap contract...');

        // Execute swap - this will open the wallet for signature
        // @ts-ignore - wagmi v2 type inference issue with complex ABIs
        swap({
          address: routerAddress,
          abi: CROSS_POOL_ROUTER_ABI,
          functionName: 'swapExactOutput',
          args: [swapParams],
        });

        // State will be updated by useEffect when transaction is submitted
        console.log('Swap contract call initiated, waiting for signature...');
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
    console.log('Transaction state:', {
      isSwapPending,
      isSwapConfirming,
      isSwapSuccess,
      hasSwapHash: !!swapHash,
      swapError: swapError?.message,
      swapReceiptError: swapReceiptError?.message,
    });

    if (isSwapPending) {
      console.log('Setting state to: signing');
      setSwapState('signing');
    } else if (swapHash && isSwapConfirming) {
      console.log('Setting state to: confirming, txHash:', swapHash);
      setSwapState('confirming');
      // Only show toast once per transaction
      if (submittedToastShown.current !== swapHash) {
        submittedToastShown.current = swapHash;
        toast({
          title: 'Transaction Submitted',
          description: `Waiting for confirmation... Hash: ${swapHash.slice(0, 10)}...`,
        });
      }
    } else if (isSwapSuccess) {
      console.log('Setting state to: success');
      setSwapState('success');
      // Only show toast once per transaction
      if (swapHash && successToastShown.current !== swapHash) {
        successToastShown.current = swapHash;
        toast({
          title: 'Swap Successful!',
          description: 'Your transaction has been confirmed',
        });
      }
    } else if (swapError || swapReceiptError) {
      console.log('Setting state to: error');
      setSwapState('error');
      const errorMessage = swapError?.message || swapReceiptError?.message || 'Transaction failed';
      toast({
        title: 'Swap Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [isSwapPending, isSwapConfirming, isSwapSuccess, swapHash, swapError, swapReceiptError, toast]);

  // Auto-update state when transaction status changes
  useEffect(() => {
    updateState();
  }, [updateState]);

  const reset = () => {
    resetSwap();
    setSwapState('idle');
    submittedToastShown.current = null;
    successToastShown.current = null;
  };

  return {
    executeSwap,
    swapState,
    isLoading,
    txHash: swapHash,
    reset,
  };
}

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address, parseUnits, maxUint256 } from 'viem';
import { CROSS_POOL_ROUTER_ABI } from '@/config/abis';
import { getCrossPoolRouter } from '@/config/contracts';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_DEADLINE } from '@/utils/constants';
import { transactionStorage } from '@/services/transactionStorage';
import { getTokensForChain } from '@/config/tokens';

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
  const publicClient = usePublicClient();
  const [swapState, setSwapState] = useState<SwapState>('idle');
  const submittedToastShown = useRef<string | null>(null);
  const successToastShown = useRef<string | null>(null);
  const currentSwapParams = useRef<SwapParams | null>(null);
  const pendingPromise = useRef<{
    resolve: () => void;
    reject: (error: any) => void;
  } | null>(null);

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
   * Build swap path and compute maxAmountIn using the on-chain quoteSwap view function.
   *
   * Instead of estimating maxAmountIn from the backend's number + a hardcoded slippage %,
   * we call quoteSwap() on-chain. That function uses the EXACT same arithmetic as
   * swapExactOutput, so the returned amountIn is always correct regardless of token type,
   * pair volatility, or pool state.
   *
   * We then add a tiny 0.5% buffer (50 bps) only to cover the few blocks between
   * this quote and the TX being mined. This buffer scales automatically:
   *  - Stable pairs → small absolute buffer
   *  - Volatile pairs → proportionally larger buffer
   * No lookup tables. No hardcoded percentages per pair.
   */
  const buildSwapPath = useCallback(
    async (params: SwapParams, routerAddress: Address) => {
      const { fromToken, toToken, fromDecimals, quoteData, deadline, recipient } = params;

      // ── 1. Build hops array ──────────────────────────────────────────────
      const hops: { tokenIn: Address; tokenOut: Address; amountOut: bigint }[] = [];

      if ('steps' in quoteData && quoteData.steps && quoteData.steps.length > 0) {
        for (const step of quoteData.steps) {
          hops.push({
            tokenIn: step.fromAddress as Address,
            tokenOut: step.toAddress as Address,
            amountOut: BigInt(step.amountOut),
          });
        }
      } else if ('bestShard' in quoteData) {
        hops.push({
          tokenIn: fromToken,
          tokenOut: toToken,
          amountOut: BigInt(quoteData.bestShard.amountOut),
        });
      } else {
        throw new Error('Invalid quote data format - missing steps');
      }

      // ── 2. On-chain quoteSwap → exact amountIn ───────────────────────────
      if (!publicClient) throw new Error('Public client not available');

      let exactAmountIn: bigint;
      try {
        // @ts-ignore — wagmi/viem type inference on complex ABIs
        const result = await publicClient.readContract({
          address: routerAddress,
          abi: CROSS_POOL_ROUTER_ABI,
          functionName: 'quoteSwap',
          args: [{ hops, maxAmountIn: maxUint256 }],
        }) as [bigint, Address[]];

        exactAmountIn = result[0];
        console.log('[quoteSwap] On-chain exactAmountIn:', exactAmountIn.toString());
      } catch (quoteErr) {
        // Fallback: use backend estimate with precise BigInt conversion.
        // This path only triggers if the pool has zero liquidity or the
        // RPC is temporarily unavailable.
        console.warn('[quoteSwap] On-chain quote failed, using backend estimate:', quoteErr);
        const amountInStr = quoteData.amountIn.toString();
        const dotIndex = amountInStr.indexOf('.');
        const truncated = dotIndex >= 0
          ? amountInStr.slice(0, dotIndex + 1 + fromDecimals)
          : amountInStr;
        exactAmountIn = parseUnits(truncated, fromDecimals);
      }

      // ── 3. Add 0.5% block-propagation buffer ────────────────────────────
      // This is the ONLY slippage added. It compensates for the few blocks
      // between calling quoteSwap and the TX landing on-chain.
      // No hardcoded pair tables — the buffer scales with exactAmountIn automatically.
      const BLOCK_BUFFER_BPS = 50n; // 0.5%
      const maxAmountIn = exactAmountIn + (exactAmountIn * BLOCK_BUFFER_BPS) / 10000n;

      console.log('[buildSwapPath]', {
        hops: hops.map(h => ({ tokenIn: h.tokenIn, tokenOut: h.tokenOut, amountOut: h.amountOut.toString() })),
        exactAmountIn: exactAmountIn.toString(),
        maxAmountIn: maxAmountIn.toString(),
      });

      // ── 4. Deadline ──────────────────────────────────────────────────────
      const deadlineMinutes = deadline || DEFAULT_DEADLINE;
      const deadlineTimestamp = BigInt(Math.floor(Date.now() / 1000) + deadlineMinutes * 60);

      return {
        hops,
        maxAmountIn,
        deadline: deadlineTimestamp,
        recipient: recipient || userAddress!,
      };
    },
    [publicClient, userAddress]
  );

  /**
   * Execute swap transaction - returns a Promise that resolves when transaction is confirmed
   */
  const executeSwap = useCallback(
    async (params: SwapParams): Promise<void> => {
      if (!userAddress || !chainId) {
        throw new Error('Wallet not connected');
      }

      // ── Phase 1 (async): get router + on-chain quote BEFORE opening the Promise.
      // buildSwapPath calls quoteSwap() on-chain — must be awaited outside new Promise().
      setSwapState('preparing');
      currentSwapParams.current = params;
      const routerAddress = getCrossPoolRouter(chainId);

      let swapParams: Awaited<ReturnType<typeof buildSwapPath>>;
      try {
        swapParams = await buildSwapPath(params, routerAddress);
      } catch (error: any) {
        console.error('On-chain quote failed:', error);
        setSwapState('error');
        toast({
          title: 'Quote Failed',
          description: error.message || 'Failed to get on-chain quote',
          variant: 'destructive',
        });
        throw error;
      }

      console.log('Executing swap:', {
        router: routerAddress,
        hops: swapParams.hops,
        maxAmountIn: swapParams.maxAmountIn.toString(),
        deadline: swapParams.deadline.toString(),
        recipient: swapParams.recipient,
      });

      // ── Phase 2 (sync): fire wallet TX, resolve when confirmed via wagmi hooks.
      return new Promise((resolve, reject) => {
        try {
          pendingPromise.current = { resolve, reject };
          setSwapState('signing');

          // Gas scales with hops — SAMM's sharding algorithm needs more than standard AMMs
          const numHops = swapParams.hops.length;
          let gasLimit: bigint;
          if (numHops === 1)      gasLimit = 800_000n;
          else if (numHops === 2) gasLimit = 1_500_000n;
          else if (numHops === 3) gasLimit = 2_000_000n;
          else                    gasLimit = 2_500_000n;

          console.log(`Gas limit for ${numHops}-hop swap: ${gasLimit.toString()}`);

          // @ts-ignore — wagmi v2 type inference issue with complex ABIs
          swap({
            address: routerAddress,
            abi: CROSS_POOL_ROUTER_ABI,
            functionName: 'swapExactOutput',
            args: [swapParams],
            gas: gasLimit,
          });

          console.log('Swap contract call initiated, waiting for confirmation...');
        } catch (error: any) {
          console.error('Swap execution failed:', error);
          setSwapState('error');
          pendingPromise.current = null;
          toast({
            title: 'Swap Failed',
            description: error.message || 'Failed to execute swap',
            variant: 'destructive',
          });
          reject(error);
        }
      });
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

        // Save pending transaction to history
        if (userAddress && chainId && currentSwapParams.current) {
          console.log('[useSwapExecution] Saving transaction to history', {
            userAddress,
            chainId,
            hash: swapHash,
          });

          const params = currentSwapParams.current;
          const tokens = getTokensForChain(chainId);
          const fromToken = tokens.find(t => t.address.toLowerCase() === params.fromToken.toLowerCase());
          const toToken = tokens.find(t => t.address.toLowerCase() === params.toToken.toLowerCase());

          transactionStorage.saveTransaction(userAddress, chainId, {
            hash: swapHash,
            type: 'swap',
            status: 'pending',
            timestamp: Date.now(),
            chainId,
            userAddress: userAddress.toLowerCase(),
            swapData: {
              fromToken: fromToken?.symbol || 'Unknown',
              toToken: toToken?.symbol || 'Unknown',
              fromAmount: params.amountIn,
              toAmount: params.amountOut,
              route: params.quoteData?.route,
            },
          });

          console.log('[useSwapExecution] Transaction saved to history successfully');
        } else {
          console.warn('[useSwapExecution] Cannot save transaction:', {
            hasUserAddress: !!userAddress,
            hasChainId: !!chainId,
            hasSwapParams: !!currentSwapParams.current,
          });
        }
      }
    } else if (isSwapSuccess) {
      console.log('Setting state to: success');
      setSwapState('success');

      // Resolve pending promise if exists
      if (pendingPromise.current) {
        pendingPromise.current.resolve();
        pendingPromise.current = null;
      }

      // Only show toast once per transaction
      if (swapHash && successToastShown.current !== swapHash) {
        successToastShown.current = swapHash;
        toast({
          title: 'Swap Successful!',
          description: 'Your transaction has been confirmed',
        });

        // Update transaction status to success
        if (userAddress && chainId) {
          transactionStorage.updateTransactionStatus(userAddress, chainId, swapHash, 'success');
        }
      }
    } else if (swapError || swapReceiptError) {
      console.log('Setting state to: error');
      setSwapState('error');
      const errorMessage = swapError?.message || swapReceiptError?.message || 'Transaction failed';

      // Reject pending promise if exists
      if (pendingPromise.current) {
        pendingPromise.current.reject(new Error(errorMessage));
        pendingPromise.current = null;
      }

      toast({
        title: 'Swap Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      // Update transaction status to failed if we have a hash
      if (swapHash && userAddress && chainId) {
        transactionStorage.updateTransactionStatus(userAddress, chainId, swapHash, 'failed');
      }
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

import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { Address, parseUnits } from 'viem';
import { CROSS_POOL_ROUTER_ABI } from '@/config/abis';
import { getCrossPoolRouter } from '@/config/contracts';
import { useToast } from './use-toast';
import { parseBlockchainError, isRetryableError } from '@/utils/errorHandler';
import { DEFAULT_DEADLINE, DEFAULT_SLIPPAGE } from '@/utils/constants';
import { SwapQuote, MultiHopRoute } from '@/services/sammApi';

interface SwapParams {
  fromToken: Address;
  toToken: Address;
  amountIn: string; // Human readable
  amountOut: string; // Human readable
  fromDecimals: number;
  toDecimals: number;
  quoteData: SwapQuote | MultiHopRoute;
  slippageTolerance?: number; // Percentage (0.5 = 0.5%)
  recipient?: Address;
}

export type SwapStatus = 'idle' | 'preparing' | 'signing' | 'confirming' | 'success' | 'error';

interface SwapState {
  status: SwapStatus;
  txHash?: `0x${string}`;
  error?: string;
}

export function useSwapExecution() {
  const { address: userAddress } = useAccount();
  const chainId = useChainId();
  const { toast } = useToast();
  const [swapState, setSwapState] = useState<SwapState>({ status: 'idle' });
  const [retryCount, setRetryCount] = useState(0);

  const {
    data: txHash,
    writeContract: executeSwapTx,
    isPending: isSigning,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    isError: isTxError,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const buildSwapPath = useCallback(
    (params: SwapParams) => {
      const {
        fromToken,
        toToken,
        amountOut,
        toDecimals,
        slippageTolerance = DEFAULT_SLIPPAGE,
        recipient,
      } = params;

      // Parse exact output amount
      const exactAmountOut = parseUnits(amountOut, toDecimals);

      // Calculate max amount in with slippage
      const expectedAmountIn = parseUnits(params.amountIn, params.fromDecimals);
      const slippageMultiplier = BigInt(Math.floor((100 + slippageTolerance) * 100));
      const maxAmountIn = (expectedAmountIn * slippageMultiplier) / BigInt(10000);

      // Build hops array based on quote type
      const hops = [];

      if ('bestShard' in params.quoteData) {
        // Direct swap (single hop)
        hops.push({
          tokenIn: fromToken,
          tokenOut: toToken,
          amountOut: exactAmountOut,
        });
      } else if ('steps' in params.quoteData) {
        // Multi-hop swap
        for (const step of params.quoteData.steps) {
          hops.push({
            tokenIn: step.from as Address,
            tokenOut: step.to as Address,
            amountOut: BigInt(step.amountOut),
          });
        }
      } else {
        throw new Error('Invalid quote data format');
      }

      // Build deadline (current time + deadline minutes)
      const deadline = BigInt(Math.floor(Date.now() / 1000) + DEFAULT_DEADLINE * 60);

      return {
        hops,
        maxAmountIn,
        deadline,
        recipient: recipient || userAddress!,
      };
    },
    [userAddress]
  );

  const executeSwapTransaction = useCallback(
    async (params: SwapParams) => {
      if (!userAddress) {
        const error = 'Wallet not connected';
        setSwapState({ status: 'error', error });
        toast({
          title: 'Wallet Not Connected',
          description: 'Please connect your wallet to swap',
          variant: 'destructive',
        });
        throw new Error(error);
      }

      try {
        setSwapState({ status: 'preparing' });

        const routerAddress = getCrossPoolRouter(chainId);
        const swapPath = buildSwapPath(params);

        console.log('Executing swap with path:', swapPath);

        setSwapState({ status: 'signing' });

        await executeSwapTx({
          address: routerAddress,
          abi: CROSS_POOL_ROUTER_ABI,
          functionName: 'swapExactOutput',
          args: [swapPath],
        });

        // Status will be updated by useEffect watching transaction
      } catch (error: any) {
        console.error('Swap execution failed:', error);

        const errorMessage = parseBlockchainError(error);
        setSwapState({ status: 'error', error: errorMessage });

        // Implement retry logic for retryable errors
        if (isRetryableError(error) && retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff

          toast({
            title: 'Retrying Transaction',
            description: `Attempt ${retryCount + 1} of 3. Retrying in ${delay / 1000}s...`,
          });

          setTimeout(() => {
            setRetryCount(retryCount + 1);
            executeSwapTransaction(params);
          }, delay);
        } else {
          toast({
            title: 'Swap Failed',
            description: errorMessage,
            variant: 'destructive',
          });
          throw error;
        }
      }
    },
    [userAddress, chainId, buildSwapPath, executeSwapTx, retryCount, toast]
  );

  // Update state based on transaction status
  useEffect(() => {
    if (isSigning) {
      setSwapState({ status: 'signing' });
    } else if (isConfirming) {
      setSwapState({ status: 'confirming', txHash });
    } else if (isSuccess) {
      setSwapState({ status: 'success', txHash });
      setRetryCount(0);
      toast({
        title: 'Swap Successful!',
        description: `Transaction confirmed`,
      });
    } else if (writeError || (isTxError && txError)) {
      const error = writeError || txError;
      const errorMessage = parseBlockchainError(error);
      setSwapState({ status: 'error', error: errorMessage, txHash });
      toast({
        title: 'Transaction Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [isSigning, isConfirming, isSuccess, writeError, isTxError, txError, txHash, toast]);

  const reset = useCallback(() => {
    setSwapState({ status: 'idle' });
    setRetryCount(0);
  }, []);

  return {
    executeSwap: executeSwapTransaction,
    swapState,
    isLoading: isSigning || isConfirming,
    reset,
  };
}

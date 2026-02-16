import { useState, useEffect, useRef } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address, parseAbi, formatUnits } from 'viem';
import { useToast } from './use-toast';
import { transactionStorage } from '@/services/transactionStorage';

const POOL_ABI = parseAbi([
  'function removeLiquidity(uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to) returns (uint256 amountA, uint256 amountB)',
]);

interface RemoveLiquidityParams {
  poolAddress: Address;
  liquidity: bigint;
  amountAMin: bigint;
  amountBMin: bigint;
  token0Symbol: string;
  token1Symbol: string;
  token0Decimals: number;
  token1Decimals: number;
}

export function useRemoveLiquidity() {
  const { address: userAddress, chainId } = useAccount();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const currentParams = useRef<RemoveLiquidityParams | null>(null);
  const hashSaved = useRef<string | null>(null);
  const pendingPromise = useRef<{
    resolve: () => void;
    reject: (error: any) => void;
  } | null>(null);

  const { writeContract, data: hash, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const removeLiquidity = async (params: RemoveLiquidityParams): Promise<void> => {
    if (!userAddress) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to remove liquidity',
        variant: 'destructive',
      });
      throw new Error('Wallet not connected');
    }

    return new Promise((resolve, reject) => {
      try {
        setIsLoading(true);

        // Store promise callbacks for later resolution
        pendingPromise.current = { resolve, reject };

        // Store params for transaction tracking
        currentParams.current = params;

        // Call removeLiquidity on the pool contract
        // @ts-ignore - wagmi v2 type inference issue with ABIs
        writeContract({
          address: params.poolAddress,
          abi: POOL_ABI,
          functionName: 'removeLiquidity',
          args: [
            params.liquidity,
            params.amountAMin,
            params.amountBMin,
            userAddress,
          ],
        });

        toast({
          title: 'Transaction Submitted',
          description: 'Removing liquidity...',
        });

        // Promise will be resolved in useEffect when transaction succeeds
      } catch (error: any) {
        console.error('Remove liquidity error:', error);

        let errorMessage = 'Failed to remove liquidity';

        if (error.message?.includes('user rejected')) {
          errorMessage = 'Transaction rejected by user';
        } else if (error.message?.includes('insufficient A amount')) {
          errorMessage = 'Slippage too low for token A. Increase slippage tolerance.';
        } else if (error.message?.includes('insufficient B amount')) {
          errorMessage = 'Slippage too low for token B. Increase slippage tolerance.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast({
          title: 'Remove Liquidity Failed',
          description: errorMessage,
          variant: 'destructive',
        });

        setIsLoading(false);
        reject(error);
      }
    });
  };

  // Save transaction to localStorage when hash is available
  useEffect(() => {
    if (hash && userAddress && chainId && currentParams.current && hashSaved.current !== hash) {
      hashSaved.current = hash;

      const params = currentParams.current;

      console.log('[useRemoveLiquidity] Saving transaction to history', {
        userAddress,
        chainId,
        hash,
      });

      // Format amounts for display
      const amount0 = formatUnits(params.amountAMin, params.token0Decimals);
      const amount1 = formatUnits(params.amountBMin, params.token1Decimals);

      transactionStorage.saveTransaction(userAddress, chainId, {
        hash,
        type: 'remove_liquidity',
        status: 'pending',
        timestamp: Date.now(),
        chainId,
        userAddress: userAddress.toLowerCase(),
        liquidityData: {
          pool: `${params.token0Symbol}-${params.token1Symbol}`,
          token0: params.token0Symbol,
          token1: params.token1Symbol,
          amount0,
          amount1,
        },
      });

      console.log('[useRemoveLiquidity] Transaction saved to history successfully');
    }
  }, [hash, userAddress, chainId]);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && hash && userAddress && chainId) {
      setIsLoading(false);

      // Update transaction status to success
      transactionStorage.updateTransactionStatus(userAddress, chainId, hash, 'success');

      // Resolve pending promise if exists
      if (pendingPromise.current) {
        pendingPromise.current.resolve();
        pendingPromise.current = null;
      }

      toast({
        title: 'Liquidity Removed!',
        description: currentParams.current
          ? `Successfully removed liquidity from ${currentParams.current.token0Symbol}-${currentParams.current.token1Symbol} pool`
          : 'Successfully removed liquidity',
      });
    }
  }, [isSuccess, hash, userAddress, chainId, toast]);

  // Handle transaction error
  useEffect(() => {
    if (writeError) {
      setIsLoading(false);

      // Update transaction status to failed if we have a hash
      if (hash && userAddress && chainId) {
        transactionStorage.updateTransactionStatus(userAddress, chainId, hash, 'failed');
      }

      // Reject pending promise if exists
      if (pendingPromise.current) {
        pendingPromise.current.reject(writeError);
        pendingPromise.current = null;
      }
    }
  }, [writeError, hash, userAddress, chainId]);

  return {
    removeLiquidity,
    isLoading: isLoading || isConfirming,
    isSuccess,
    hash,
    error: writeError,
  };
}

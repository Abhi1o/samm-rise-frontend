import { useState, useEffect, useRef } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, Address } from 'viem';
import { useToast } from './use-toast';
import { SAMMPoolABI } from '@/config/abis';
import { GAS_LIMITS } from '@/utils/constants';
import { transactionStorage } from '@/services/transactionStorage';
import { getTokensForChain } from '@/config/tokens';

interface AddLiquidityParams {
  poolAddress: Address;
  tokenA: Address;
  tokenB: Address;
  amountADesired: string;
  amountBDesired: string;
  amountAMin: string;
  amountBMin: string;
  decimalsA: number;
  decimalsB: number;
}

export function useAddLiquidity() {
  const { address, chainId } = useAccount();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const pendingPromise = useRef<{
    resolve: () => void;
    reject: (error: any) => void;
  } | null>(null);
  const currentParams = useRef<AddLiquidityParams | null>(null);
  const hashSaved = useRef<string | null>(null);

  const { writeContract, data: hash, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const addLiquidity = async (params: AddLiquidityParams): Promise<void> => {
    if (!address) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to add liquidity',
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

        // Parse amounts to wei
        const amountADesiredWei = parseUnits(params.amountADesired, params.decimalsA);
        const amountBDesiredWei = parseUnits(params.amountBDesired, params.decimalsB);
        const amountAMinWei = parseUnits(params.amountAMin, params.decimalsA);
        const amountBMinWei = parseUnits(params.amountBMin, params.decimalsB);

        // Call addLiquidity on the pool contract
        // @ts-ignore - wagmi v2 type inference issue with complex ABIs
        writeContract({
          address: params.poolAddress,
          abi: SAMMPoolABI,
          functionName: 'addLiquidity',
          args: [
            amountADesiredWei,
            amountBDesiredWei,
            amountAMinWei,
            amountBMinWei,
            address, // recipient
          ],
          gas: GAS_LIMITS.addLiquidity,
        });

        toast({
          title: 'Transaction Submitted',
          description: 'Adding liquidity to pool...',
        });
      } catch (error: any) {
        console.error('Add liquidity error:', error);
        toast({
          title: 'Transaction Failed',
          description: error.message || 'Failed to add liquidity',
          variant: 'destructive',
        });
        setIsLoading(false);
        pendingPromise.current = null;
        reject(error);
      }
    });
  };

  // Save transaction to localStorage when hash is available
  useEffect(() => {
    if (hash && address && chainId && currentParams.current && hashSaved.current !== hash) {
      hashSaved.current = hash;

      const params = currentParams.current;
      const tokens = getTokensForChain(chainId);
      const tokenA = tokens.find(t => t.address.toLowerCase() === params.tokenA.toLowerCase());
      const tokenB = tokens.find(t => t.address.toLowerCase() === params.tokenB.toLowerCase());

      console.log('[useAddLiquidity] Saving transaction to history', {
        userAddress: address,
        chainId,
        hash,
      });

      transactionStorage.saveTransaction(address, chainId, {
        hash,
        type: 'add_liquidity',
        status: 'pending',
        timestamp: Date.now(),
        chainId,
        userAddress: address.toLowerCase(),
        liquidityData: {
          pool: `${tokenA?.symbol || 'Unknown'}-${tokenB?.symbol || 'Unknown'}`,
          token0: tokenA?.symbol || 'Unknown',
          token1: tokenB?.symbol || 'Unknown',
          amount0: params.amountADesired,
          amount1: params.amountBDesired,
        },
      });

      console.log('[useAddLiquidity] Transaction saved to history successfully');
    }
  }, [hash, address, chainId]);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess) {
      setIsLoading(false);

      // Update transaction status to success
      if (hash && address && chainId) {
        transactionStorage.updateTransactionStatus(address, chainId, hash, 'success');
      }

      // Resolve pending promise if exists
      if (pendingPromise.current) {
        pendingPromise.current.resolve();
        pendingPromise.current = null;
      }
    }
  }, [isSuccess, hash, address, chainId]);

  // Handle transaction error
  useEffect(() => {
    if (writeError) {
      setIsLoading(false);

      // Update transaction status to failed if we have a hash
      if (hash && address && chainId) {
        transactionStorage.updateTransactionStatus(address, chainId, hash, 'failed');
      }

      // Reject pending promise if exists
      if (pendingPromise.current) {
        pendingPromise.current.reject(writeError);
        pendingPromise.current = null;
      }
    }
  }, [writeError, hash, address, chainId]);

  return {
    addLiquidity,
    isLoading: isLoading || isConfirming,
    isSuccess,
    hash,
    error: writeError,
  };
}

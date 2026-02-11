import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, Address } from 'viem';
import { useToast } from './use-toast';
import { SAMMPoolABI } from '@/config/abis';

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
  const { address } = useAccount();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { writeContract, data: hash, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const addLiquidity = async (params: AddLiquidityParams) => {
    if (!address) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to add liquidity',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      // Parse amounts to wei
      const amountADesiredWei = parseUnits(params.amountADesired, params.decimalsA);
      const amountBDesiredWei = parseUnits(params.amountBDesired, params.decimalsB);
      const amountAMinWei = parseUnits(params.amountAMin, params.decimalsA);
      const amountBMinWei = parseUnits(params.amountBMin, params.decimalsB);

      // Call addLiquidity on the pool contract
      await writeContract({
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
    }
  };

  // Handle transaction state changes
  if (isSuccess && isLoading) {
    setIsLoading(false);
  }

  if (writeError && isLoading) {
    setIsLoading(false);
  }

  return {
    addLiquidity,
    isLoading: isLoading || isConfirming,
    isSuccess,
    hash,
    error: writeError,
  };
}

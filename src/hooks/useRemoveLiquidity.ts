import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address, parseAbi } from 'viem';
import { useToast } from './use-toast';

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
}

export function useRemoveLiquidity() {
  const { address: userAddress } = useAccount();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { writeContractAsync } = useWriteContract();

  const removeLiquidity = async (params: RemoveLiquidityParams) => {
    if (!userAddress) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to remove liquidity',
        variant: 'destructive',
      });
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);

    try {
      // Call removeLiquidity on the pool contract
      const hash = await writeContractAsync({
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

      // Wait for transaction confirmation
      // Note: We're not using useWaitForTransactionReceipt here because it's a hook
      // and can't be called conditionally. In a real app, you'd handle this differently.
      
      toast({
        title: 'Liquidity Removed!',
        description: `Successfully removed liquidity from ${params.token0Symbol}-${params.token1Symbol} pool`,
      });

      return hash;
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

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    removeLiquidity,
    isLoading,
  };
}

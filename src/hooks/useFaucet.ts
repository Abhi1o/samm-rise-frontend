import { useEffect, useRef } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address } from 'viem';
import { TokenFaucetABI, TOKEN_FAUCET_ADDRESS } from '@/config/abis/TokenFaucet';
import { useToast } from '@/hooks/use-toast';
import { riseChain } from '@/config/chains';

/**
 * Custom hook for interacting with the TokenFaucet contract
 * Provides functionality to request test tokens on RiseChain Testnet
 *
 * @param userAddress - The user's wallet address
 * @param chainId - Current chain ID to check if on RiseChain
 * @returns Faucet state and functions
 */
export function useFaucet(userAddress?: Address, chainId?: number) {
  const { toast } = useToast();
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const successToastShown = useRef(false);

  // Only enable faucet on RiseChain Testnet
  const isRiseChain = chainId === riseChain.id;
  const isEnabled = !!userAddress && isRiseChain;

  // Check if user can request tokens
  const {
    data: canRequest,
    refetch: refetchCanRequest,
    isLoading: isCheckingEligibility,
  } = useReadContract({
    address: TOKEN_FAUCET_ADDRESS,
    abi: TokenFaucetABI,
    functionName: 'canRequest',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: isEnabled,
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });

  // Get time until next request
  const {
    data: timeUntilNext,
    refetch: refetchTime,
  } = useReadContract({
    address: TOKEN_FAUCET_ADDRESS,
    abi: TokenFaucetABI,
    functionName: 'timeUntilNextRequest',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: isEnabled,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Get cooldown period
  const { data: cooldownPeriod } = useReadContract({
    address: TOKEN_FAUCET_ADDRESS,
    abi: TokenFaucetABI,
    functionName: 'cooldownPeriod',
    query: {
      enabled: isRiseChain,
    },
  });

  // Wait for transaction confirmation
  const {
    isSuccess,
    isError,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle success
  useEffect(() => {
    if (isSuccess && !successToastShown.current) {
      successToastShown.current = true;

      toast({
        title: '🎉 Test Tokens Received!',
        description: 'Your test tokens have been successfully claimed. Check your wallet.',
      });

      // Refetch eligibility after successful claim
      setTimeout(() => {
        refetchCanRequest();
        refetchTime();
        reset();
        successToastShown.current = false;
      }, 2000);
    }
  }, [isSuccess, toast, refetchCanRequest, refetchTime, reset]);

  // Handle errors
  useEffect(() => {
    if (isError && txError) {
      toast({
        title: 'Claim Failed',
        description: txError.message || 'Failed to claim test tokens. Please try again.',
        variant: 'destructive',
      });
      reset();
    }
  }, [isError, txError, toast, reset]);

  /**
   * Request test tokens from the faucet
   */
  const requestTokens = async () => {
    if (!isEnabled) {
      toast({
        title: 'Wrong Network',
        description: 'Please switch to RiseChain Testnet to claim test tokens',
        variant: 'destructive',
      });
      return;
    }

    if (!canRequest) {
      const minutesLeft = timeUntilNext ? Math.ceil(Number(timeUntilNext) / 60) : 60;
      toast({
        title: 'Cooldown Active',
        description: `Please wait ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''} before claiming again`,
        variant: 'destructive',
      });
      return;
    }

    try {
      writeContract({
        address: TOKEN_FAUCET_ADDRESS,
        abi: TokenFaucetABI,
        functionName: 'requestTokens',
        gas: 500000n,
        account: userAddress,
        chain: riseChain,
      });

      toast({
        title: 'Claiming Tokens...',
        description: 'Please confirm the transaction in your wallet',
      });
    } catch (error: any) {
      console.error('Faucet request error:', error);

      // Provide more specific error messages
      let errorMessage = 'Failed to initiate token claim';

      if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient ETH for gas fees. Please get some testnet ETH first.';
      } else if (error.message?.includes('Cooldown')) {
        errorMessage = 'Cooldown period active. Please wait before claiming again.';
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction rejected by user';
        return; // Don't show error toast for user rejection
      }

      toast({
        title: 'Request Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  /**
   * Format time remaining as human-readable string
   */
  const formatTimeRemaining = (): string => {
    if (!timeUntilNext || timeUntilNext === 0n) return 'Ready';

    const seconds = Number(timeUntilNext);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return {
    // Functions
    requestTokens,
    refetchCanRequest,
    refetchTime,
    formatTimeRemaining,

    // State
    canRequest: Boolean(canRequest),
    timeUntilNext: timeUntilNext ? Number(timeUntilNext) : 0,
    cooldownPeriod: cooldownPeriod ? Number(cooldownPeriod) : 3600,
    isPending,
    isSuccess,
    isError,
    isCheckingEligibility,
    isEnabled: isRiseChain,
    hash,
  };
}

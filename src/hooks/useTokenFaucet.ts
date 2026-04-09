import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { Address } from 'viem';
import { TOKEN_FAUCET_ABI } from '@/config/abis';
import { getTokenFaucet, hasContracts } from '@/config/contracts';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef } from 'react';

export interface FaucetTokenInfo {
  tokenAddress: Address;
  symbol: string;
  amount: bigint;
  isActive: boolean;
}

export type FaucetState = 'idle' | 'requesting' | 'confirming' | 'success' | 'error';

/**
 * Hook for interacting with the TokenFaucet contract
 * Allows users to request test tokens on testnet
 */
export function useTokenFaucet() {
  const { toast } = useToast();
  const { address: userAddress } = useAccount();
  const chainId = useChainId();
  const faucetAddress = hasContracts(chainId) ? getTokenFaucet(chainId) : undefined;
  const successToastShown = useRef<string | null>(null);

  // Check if user can request tokens
  const {
    data: canRequestData,
    isLoading: canRequestLoading,
    refetch: refetchCanRequest,
  } = useReadContract({
    address: faucetAddress,
    abi: TOKEN_FAUCET_ABI,
    functionName: 'canRequest',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress && !!faucetAddress,
    },
  });

  // Get time until next request
  const {
    data: timeUntilNextData,
    isLoading: timeUntilNextLoading,
    refetch: refetchTimeUntilNext,
  } = useReadContract({
    address: faucetAddress,
    abi: TOKEN_FAUCET_ABI,
    functionName: 'timeUntilNextRequest',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress && !!faucetAddress,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Get all available tokens
  const {
    data: availableTokensData,
    isLoading: tokensLoading,
    refetch: refetchTokens,
    error: tokensError,
  } = useReadContract({
    address: faucetAddress,
    abi: TOKEN_FAUCET_ABI,
    functionName: 'getAllTokens',
    query: {
      enabled: !!faucetAddress,
    },
  });

  // Log token data for debugging
  useEffect(() => {
    console.log('Faucet token data:', {
      faucetAddress,
      availableTokensData,
      tokensLoading,
      tokensError: tokensError?.message,
    });
  }, [faucetAddress, availableTokensData, tokensLoading, tokensError]);

  // Get cooldown period
  const { data: cooldownPeriodData } = useReadContract({
    address: faucetAddress,
    abi: TOKEN_FAUCET_ABI,
    functionName: 'cooldownPeriod',
    query: {
      enabled: !!faucetAddress,
    },
  });

  // Write contract for requesting tokens
  const {
    writeContract: request,
    data: requestHash,
    isPending: isRequestPending,
    error: requestError,
  } = useWriteContract();

  // Wait for request transaction
  const {
    isLoading: isRequestConfirming,
    isSuccess: isRequestSuccess,
    error: requestReceiptError,
  } = useWaitForTransactionReceipt({
    hash: requestHash,
  });

  // Determine faucet state
  const getFaucetState = (): FaucetState => {
    if (isRequestPending) return 'requesting';
    if (requestHash && isRequestConfirming) return 'confirming';
    if (isRequestSuccess) return 'success';
    if (requestError || requestReceiptError) return 'error';
    return 'idle';
  };

  const faucetState = getFaucetState();

  // Show success toast
  useEffect(() => {
    if (isRequestSuccess && requestHash && successToastShown.current !== requestHash) {
      successToastShown.current = requestHash;
      toast({
        title: 'Tokens Received!',
        description: 'Test tokens have been sent to your wallet',
      });
      // Refetch data after success
      refetchCanRequest();
      refetchTimeUntilNext();
      refetchTokens();
    }
  }, [isRequestSuccess, requestHash, toast, refetchCanRequest, refetchTimeUntilNext, refetchTokens]);

  // Show error toast
  useEffect(() => {
    if (requestError || requestReceiptError) {
      const errorMessage = requestError?.message || requestReceiptError?.message || 'Failed to request tokens';
      toast({
        title: 'Request Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [requestError, requestReceiptError, toast]);

  /**
   * Request tokens from the faucet
   */
  const requestTokens = () => {
    if (!userAddress) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to request tokens',
        variant: 'destructive',
      });
      return;
    }

    if (!faucetAddress) {
      toast({
        title: 'Faucet Not Available',
        description: 'Token faucet is not available on this network',
        variant: 'destructive',
      });
      return;
    }

    if (!canRequestData) {
      toast({
        title: 'Cooldown Active',
        description: 'Please wait before requesting tokens again',
        variant: 'destructive',
      });
      return;
    }

    // @ts-ignore - wagmi v2 type inference
    request({
      address: faucetAddress,
      abi: TOKEN_FAUCET_ABI,
      functionName: 'requestTokens',
    });

    toast({
      title: 'Request Submitted',
      description: 'Please sign the transaction in your wallet',
    });
  };

  return {
    canRequest: canRequestData as boolean | undefined,
    timeUntilNext: timeUntilNextData as bigint | undefined,
    availableTokens: availableTokensData as FaucetTokenInfo[] | undefined,
    cooldownPeriod: cooldownPeriodData as bigint | undefined,
    requestTokens,
    isLoading: canRequestLoading || timeUntilNextLoading || tokensLoading,
    faucetState,
    isRequesting: isRequestPending || isRequestConfirming,
    txHash: requestHash,
    refetch: () => {
      refetchCanRequest();
      refetchTimeUntilNext();
      refetchTokens();
    },
  };
}

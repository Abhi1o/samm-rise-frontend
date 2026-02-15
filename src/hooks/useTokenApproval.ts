import { useState, useEffect, useRef } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address } from 'viem';
import { ERC20_ABI, MAX_UINT256 } from '@/utils/constants';
import { useToast } from '@/hooks/use-toast';

export type ApprovalState = 'idle' | 'checking' | 'approving' | 'approved' | 'error';

interface UseTokenApprovalParams {
  tokenAddress: Address | undefined;
  spenderAddress: Address | undefined;
  amountNeeded: bigint;
  enabled?: boolean;
}

interface UseTokenApprovalReturn {
  needsApproval: boolean;
  approveToken: (amount?: bigint) => Promise<void>;
  isApproving: boolean;
  allowance: bigint;
  approvalState: ApprovalState;
  approvalHash: string | undefined;
  reset: () => void;
}

/**
 * Hook for handling ERC20 token approvals
 * Uses infinite approval (MAX_UINT256) by default for gas efficiency
 */
export function useTokenApproval({
  tokenAddress,
  spenderAddress,
  amountNeeded,
  enabled = true,
}: UseTokenApprovalParams): UseTokenApprovalReturn {
  const { toast } = useToast();
  const { address: userAddress } = useAccount();
  const [approvalState, setApprovalState] = useState<ApprovalState>('idle');
  const pendingPromise = useRef<{
    resolve: () => void;
    reject: (error: any) => void;
  } | null>(null);

  // Read current allowance
  const {
    data: allowance,
    refetch: refetchAllowance,
    isLoading: isCheckingAllowance,
  } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: userAddress && spenderAddress ? [userAddress, spenderAddress] : undefined,
    query: {
      enabled: enabled && !!tokenAddress && !!spenderAddress && !!userAddress,
    },
  });

  // Write contract for approval
  const {
    writeContract: approve,
    data: approvalHash,
    isPending: isApprovePending,
    error: approveError,
    reset: resetApprove,
  } = useWriteContract();

  // Wait for approval transaction
  const {
    isLoading: isApprovalConfirming,
    isSuccess: isApprovalSuccess,
    error: approvalReceiptError,
  } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  const currentAllowance = (allowance as bigint) || 0n;
  const needsApproval = currentAllowance < amountNeeded;
  const isApproving = isApprovePending || isApprovalConfirming;

  // Update approval state
  useEffect(() => {
    if (isCheckingAllowance) {
      setApprovalState('checking');
    } else if (isApproving) {
      setApprovalState('approving');
    } else if (isApprovalSuccess) {
      setApprovalState('approved');
    } else if (approveError || approvalReceiptError) {
      setApprovalState('error');
    } else if (!needsApproval && (currentAllowance as bigint) > 0n) {
      setApprovalState('approved');
    } else {
      setApprovalState('idle');
    }
  }, [
    isCheckingAllowance,
    isApproving,
    isApprovalSuccess,
    approveError,
    approvalReceiptError,
    needsApproval,
    currentAllowance,
  ]);

  // Show toast on approval success and resolve pending promise
  useEffect(() => {
    if (isApprovalSuccess) {
      // Resolve pending promise if exists
      if (pendingPromise.current) {
        pendingPromise.current.resolve();
        pendingPromise.current = null;
      }

      toast({
        title: 'Approval Successful',
        description: 'Token approved for trading',
      });
      refetchAllowance();
    }
  }, [isApprovalSuccess, toast, refetchAllowance]);

  // Show toast on approval error and reject pending promise
  useEffect(() => {
    if (approveError || approvalReceiptError) {
      // Reject pending promise if exists
      if (pendingPromise.current) {
        pendingPromise.current.reject(approveError || approvalReceiptError);
        pendingPromise.current = null;
      }
    }

    if (approveError) {
      toast({
        title: 'Approval Failed',
        description: approveError.message || 'Failed to approve token',
        variant: 'destructive',
      });
    }
    if (approvalReceiptError) {
      toast({
        title: 'Approval Transaction Failed',
        description: approvalReceiptError.message || 'Transaction was reverted',
        variant: 'destructive',
      });
    }
  }, [approveError, approvalReceiptError, toast]);

  /**
   * Approve tokens for spending
   * Uses infinite approval (MAX_UINT256) by default to avoid future approvals
   * Returns a Promise that resolves only when the transaction is confirmed on-chain
   */
  const approveToken = async (amount?: bigint): Promise<void> => {
    if (!tokenAddress || !spenderAddress) {
      throw new Error('Token address or spender address not provided');
    }

    // Use infinite approval by default for gas efficiency
    const approvalAmount = amount || MAX_UINT256;

    return new Promise((resolve, reject) => {
      try {
        // Store promise callbacks for later resolution
        pendingPromise.current = { resolve, reject };

        // @ts-ignore - wagmi v2 writeContract signature compatibility
        approve({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [spenderAddress, approvalAmount],
        });
      } catch (error) {
        console.error('Approval error:', error);
        pendingPromise.current = null;
        reject(error);
      }
    });
  };

  const reset = () => {
    resetApprove();
    setApprovalState('idle');
  };

  return {
    needsApproval,
    approveToken,
    isApproving,
    allowance: currentAllowance,
    approvalState,
    approvalHash,
    reset,
  };
}

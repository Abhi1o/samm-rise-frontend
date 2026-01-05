import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address } from 'viem';
import { ERC20_ABI, MAX_UINT256 } from '@/utils/constants';
import { useToast } from './use-toast';
import { parseBlockchainError } from '@/utils/errorHandler';

interface UseTokenApprovalParams {
  tokenAddress: Address;
  spenderAddress: Address;
  amountNeeded: bigint;
  enabled?: boolean;
}

export type ApprovalState = 'idle' | 'checking' | 'approving' | 'approved' | 'error';

export function useTokenApproval({
  tokenAddress,
  spenderAddress,
  amountNeeded,
  enabled = true,
}: UseTokenApprovalParams) {
  const { address: userAddress } = useAccount();
  const { toast } = useToast();
  const [approvalState, setApprovalState] = useState<ApprovalState>('idle');

  // Check current allowance
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
      enabled: enabled && !!userAddress && !!spenderAddress && !!tokenAddress,
    },
  });

  const currentAllowance = (allowance as bigint) || BigInt(0);
  const needsApproval = currentAllowance < amountNeeded;

  // Approve token
  const {
    data: approvalHash,
    writeContract: approve,
    isPending: isApprovePending,
    error: approvalError,
  } = useWriteContract();

  // Wait for approval transaction
  const {
    isLoading: isApprovalConfirming,
    isSuccess: isApprovalSuccess,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  // Update approval state based on transaction status
  useEffect(() => {
    if (isCheckingAllowance) {
      setApprovalState('checking');
    } else if (isApprovePending || isApprovalConfirming) {
      setApprovalState('approving');
    } else if (isApprovalSuccess) {
      setApprovalState('approved');
      refetchAllowance();
      toast({
        title: 'Approval Successful',
        description: 'Token approved for trading',
      });
    } else if (approvalError || txError) {
      setApprovalState('error');
    } else if (!needsApproval && allowance !== undefined) {
      setApprovalState('approved');
    } else {
      setApprovalState('idle');
    }
  }, [
    isCheckingAllowance,
    isApprovePending,
    isApprovalConfirming,
    isApprovalSuccess,
    approvalError,
    txError,
    needsApproval,
    allowance,
    refetchAllowance,
    toast,
  ]);

  const approveToken = async (amount?: bigint) => {
    if (!userAddress || !tokenAddress || !spenderAddress) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to approve tokens',
        variant: 'destructive',
      });
      return;
    }

    try {
      setApprovalState('approving');

      // Use MAX_UINT256 for infinite approval (gas efficient, prevents future approvals)
      const approvalAmount = amount || MAX_UINT256;

      await approve({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spenderAddress, approvalAmount],
      });
    } catch (error: any) {
      setApprovalState('error');
      const errorMessage = parseBlockchainError(error);
      toast({
        title: 'Approval Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const reset = () => {
    setApprovalState('idle');
  };

  return {
    allowance: currentAllowance,
    needsApproval,
    approvalState,
    approveToken,
    isApproving: isApprovePending || isApprovalConfirming,
    isCheckingAllowance,
    refetchAllowance,
    reset,
  };
}

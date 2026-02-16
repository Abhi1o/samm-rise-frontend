import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address, parseUnits } from 'viem';
import { useTokenApproval } from './useTokenApproval';
import { SAMMPoolFactoryABI } from '@/config/abis';
import { getFactory } from '@/config/contracts';
import { Token } from '@/types/tokens';
import { useToast } from './use-toast';

export type BatchCreatePoolStep =
  | 'idle'
  | 'checking'
  | 'approving_token0'
  | 'approved_token0'
  | 'approving_token1'
  | 'approved_token1'
  | 'creating_shard'
  | 'created_shard'
  | 'initializing_shard'
  | 'success'
  | 'error';

export interface ProgressStep {
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  hash?: string;
}

interface SAMMParams {
  beta1: bigint;
  rmin: bigint;
  rmax: bigint;
  c: bigint;
}

interface FeeParams {
  tradeFeeNumerator: bigint;
  tradeFeeDenominator: bigint;
  ownerFeeNumerator: bigint;
  ownerFeeDenominator: bigint;
}

interface UseBatchCreatePoolParams {
  token0?: Token;
  token1?: Token;
  amount0?: string;
  amount1?: string;
  sammParams?: SAMMParams;
  feeParams?: FeeParams;
  useDefaultParams?: boolean;
}

export interface UseBatchCreatePoolReturn {
  executeBatchCreatePool: () => Promise<void>;
  currentStep: BatchCreatePoolStep;
  steps: ProgressStep[];
  isLoading: boolean;
  error: Error | undefined;
  reset: () => void;
  createdPoolAddress?: Address;
}

/**
 * Batch create pool hook that orchestrates:
 * 1. Approve token0
 * 2. Approve token1
 * 3. Create shard
 * 4. Initialize shard with initial liquidity
 */
export function useBatchCreatePool(params: UseBatchCreatePoolParams): UseBatchCreatePoolReturn {
  const { address, chainId } = useAccount();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<BatchCreatePoolStep>('idle');
  const [error, setError] = useState<Error | undefined>();
  const [createdPoolAddress, setCreatedPoolAddress] = useState<Address | undefined>();

  const pendingPromise = useRef<{
    resolve: () => void;
    reject: (error: any) => void;
  } | null>(null);

  // Get factory address
  const factoryAddress = chainId ? getFactory(chainId) : undefined;

  // Convert string amounts to bigint
  const amount0Needed = useMemo(() => {
    if (!params.amount0 || !params.token0?.decimals) return 0n;
    try {
      return parseUnits(params.amount0, params.token0.decimals);
    } catch {
      return 0n;
    }
  }, [params.amount0, params.token0?.decimals]);

  const amount1Needed = useMemo(() => {
    if (!params.amount1 || !params.token1?.decimals) return 0n;
    try {
      return parseUnits(params.amount1, params.token1.decimals);
    } catch {
      return 0n;
    }
  }, [params.amount1, params.token1?.decimals]);

  // Token approvals for factory
  const token0Approval = useTokenApproval({
    tokenAddress: params.token0?.address as Address,
    spenderAddress: factoryAddress,
    amountNeeded: amount0Needed,
    enabled: !!params.token0 && !!factoryAddress && !!params.amount0,
  });

  const token1Approval = useTokenApproval({
    tokenAddress: params.token1?.address as Address,
    spenderAddress: factoryAddress,
    amountNeeded: amount1Needed,
    enabled: !!params.token1 && !!factoryAddress && !!params.amount1,
  });

  // Create shard transaction
  const {
    writeContract: createShardWrite,
    data: createShardHash,
    isPending: isCreateShardPending,
    error: createShardError,
  } = useWriteContract();

  const {
    isLoading: isCreateShardConfirming,
    isSuccess: isCreateShardSuccess,
    data: createShardReceipt,
  } = useWaitForTransactionReceipt({
    hash: createShardHash,
  });

  // Initialize shard transaction
  const {
    writeContract: initializeShardWrite,
    data: initializeShardHash,
    isPending: isInitializeShardPending,
    error: initializeShardError,
  } = useWriteContract();

  const { isLoading: isInitializeShardConfirming, isSuccess: isInitializeShardSuccess } =
    useWaitForTransactionReceipt({
      hash: initializeShardHash,
    });

  /**
   * Build progress steps
   */
  const steps: ProgressStep[] = useMemo(() => {
    const stepsList: ProgressStep[] = [];

    // Token0 approval step
    if (token0Approval.needsApproval) {
      stepsList.push({
        label: `Approve ${params.token0?.symbol || 'Token0'}`,
        status:
          currentStep === 'idle' || currentStep === 'checking'
            ? 'pending'
            : currentStep === 'approving_token0'
            ? 'active'
            : ['approved_token0', 'approving_token1', 'approved_token1', 'creating_shard', 'created_shard', 'initializing_shard', 'success'].includes(
                currentStep
              )
            ? 'complete'
            : currentStep === 'error'
            ? 'error'
            : 'pending',
        hash: token0Approval.approvalHash,
      });
    }

    // Token1 approval step
    if (token1Approval.needsApproval) {
      stepsList.push({
        label: `Approve ${params.token1?.symbol || 'Token1'}`,
        status:
          currentStep === 'idle' ||
          currentStep === 'checking' ||
          currentStep === 'approving_token0' ||
          currentStep === 'approved_token0'
            ? 'pending'
            : currentStep === 'approving_token1'
            ? 'active'
            : ['approved_token1', 'creating_shard', 'created_shard', 'initializing_shard', 'success'].includes(currentStep)
            ? 'complete'
            : currentStep === 'error'
            ? 'error'
            : 'pending',
        hash: token1Approval.approvalHash,
      });
    }

    // Create shard step
    stepsList.push({
      label: 'Create Pool Shard',
      status:
        currentStep === 'creating_shard'
          ? 'active'
          : ['created_shard', 'initializing_shard', 'success'].includes(currentStep)
          ? 'complete'
          : currentStep === 'error'
          ? 'error'
          : 'pending',
      hash: createShardHash,
    });

    // Initialize shard step
    stepsList.push({
      label: 'Initialize with Liquidity',
      status:
        currentStep === 'initializing_shard'
          ? 'active'
          : currentStep === 'success'
          ? 'complete'
          : currentStep === 'error'
          ? 'error'
          : 'pending',
      hash: initializeShardHash,
    });

    return stepsList;
  }, [currentStep, token0Approval, token1Approval, params.token0, params.token1, createShardHash, initializeShardHash]);

  /**
   * Execute batch pool creation
   */
  const executeBatchCreatePool = useCallback(async () => {
    if (!address || !chainId || !factoryAddress) {
      throw new Error('Missing required parameters');
    }

    if (!params.token0 || !params.token1 || !params.amount0 || !params.amount1) {
      throw new Error('Missing token or amount parameters');
    }

    return new Promise<void>((resolve, reject) => {
      const executeSteps = async () => {
        try {
          setError(undefined);
          setCurrentStep('checking');

          // Store promise callbacks
          pendingPromise.current = { resolve, reject };

          // Step 1: Approve token0 if needed
          if (token0Approval.needsApproval) {
            setCurrentStep('approving_token0');
            await token0Approval.approveToken();
            setCurrentStep('approved_token0');
          }

          // Step 2: Approve token1 if needed
          if (token1Approval.needsApproval) {
            setCurrentStep('approving_token1');
            await token1Approval.approveToken();
            setCurrentStep('approved_token1');
          }

          // Step 3: Create shard
          setCurrentStep('creating_shard');

          // Prepare parameters
          const tokenA = params.token0.address as Address;
          const tokenB = params.token1.address as Address;

          console.log('[useBatchCreatePool] Creating shard:', {
            tokenA,
            tokenB,
            useDefaultParams: params.useDefaultParams,
          });

          // Use createShardDefault if using default parameters
          if (params.useDefaultParams) {
            // @ts-ignore - wagmi v2 type inference
            createShardWrite({
              address: factoryAddress,
              abi: SAMMPoolFactoryABI,
              functionName: 'createShardDefault',
              args: [tokenA, tokenB],
            });
          } else {
            // Use custom parameters
            if (!params.sammParams || !params.feeParams) {
              throw new Error('SAMM parameters and fee parameters required when not using defaults');
            }

            // @ts-ignore - wagmi v2 type inference
            createShardWrite({
              address: factoryAddress,
              abi: SAMMPoolFactoryABI,
              functionName: 'createShard',
              args: [tokenA, tokenB, params.sammParams, params.feeParams],
            });
          }

          // Wait for createShard to complete - handled in useEffect
        } catch (err: any) {
          console.error('[useBatchCreatePool] Error:', err);
          setError(err);
          setCurrentStep('error');
          pendingPromise.current = null;
          reject(err);
        }
      };

      executeSteps();
    });
  }, [
    address,
    chainId,
    factoryAddress,
    params,
    token0Approval,
    token1Approval,
    createShardWrite,
  ]);

  // Handle createShard success - extract shard address from event and proceed to initialize
  useEffect(() => {
    if (isCreateShardSuccess && createShardHash && createShardReceipt && currentStep === 'creating_shard') {
      console.log('[useBatchCreatePool] Shard created, hash:', createShardHash);
      console.log('[useBatchCreatePool] Receipt:', createShardReceipt);

      setCurrentStep('created_shard');

      // Parse the ShardCreated event from transaction logs
      try {
        // In wagmi v2, logs are in receipt.logs
        const logs = createShardReceipt.logs || [];
        console.log('[useBatchCreatePool] Transaction logs:', logs);

        // Find the ShardCreated event from the factory contract
        // The event is: ShardCreated(address indexed shard, address indexed tokenA, address indexed tokenB, uint256 shardIndex, address creator)
        // topics[0] = event signature (keccak256 of event name)
        // topics[1] = shard address (first indexed param)
        // topics[2] = tokenA address (second indexed param)
        // topics[3] = tokenB address (third indexed param)

        let shardAddress: Address | null = null;

        for (const log of logs) {
          // Check if this log is from the factory contract
          if (log.address?.toLowerCase() === factoryAddress?.toLowerCase()) {
            // The shard address is in topics[1] for the ShardCreated event
            if (log.topics && log.topics.length >= 2) {
              // Extract address from topic (topics are 32 bytes, address is last 20 bytes)
              const addressHex = log.topics[1];
              // Remove '0x' and get last 40 characters (20 bytes = 40 hex chars)
              const cleanAddress = addressHex.replace('0x', '');
              shardAddress = ('0x' + cleanAddress.slice(-40)) as Address;
              console.log('[useBatchCreatePool] Extracted shard address from topics:', shardAddress);
              break;
            }
          }
        }

        if (shardAddress) {
          console.log('[useBatchCreatePool] Shard address extracted:', shardAddress);
          setCreatedPoolAddress(shardAddress);

          toast({
            title: 'Pool Shard Created',
            description: 'Initializing with liquidity...',
          });

          // Now initialize the shard with liquidity
          if (params.amount0 && params.amount1 && params.token0 && params.token1) {
            setCurrentStep('initializing_shard');

            const amountAWei = parseUnits(params.amount0, params.token0.decimals);
            const amountBWei = parseUnits(params.amount1, params.token1.decimals);

            console.log('[useBatchCreatePool] Initializing shard:', {
              shardAddress,
              amountA: amountAWei.toString(),
              amountB: amountBWei.toString(),
            });

            // Call initializeShard
            // @ts-ignore - wagmi v2 type inference
            initializeShardWrite({
              address: factoryAddress,
              abi: SAMMPoolFactoryABI,
              functionName: 'initializeShard',
              args: [shardAddress, amountAWei, amountBWei],
            });
          } else {
            throw new Error('Missing amount parameters for initialization');
          }
        } else {
          throw new Error('Could not extract shard address from transaction receipt');
        }
      } catch (err: any) {
        console.error('[useBatchCreatePool] Error extracting shard address:', err);
        setError(err);
        setCurrentStep('error');

        if (pendingPromise.current) {
          pendingPromise.current.reject(err);
          pendingPromise.current = null;
        }

        toast({
          title: 'Initialization Failed',
          description: 'Pool created but could not initialize with liquidity. ' + err.message,
          variant: 'destructive',
        });
      }
    }
  }, [isCreateShardSuccess, createShardHash, createShardReceipt, currentStep, factoryAddress, params, initializeShardWrite, toast]);

  // Handle createShard error
  useEffect(() => {
    if (createShardError) {
      setError(createShardError as Error);
      setCurrentStep('error');

      if (pendingPromise.current) {
        pendingPromise.current.reject(createShardError);
        pendingPromise.current = null;
      }

      toast({
        title: 'Shard Creation Failed',
        description: createShardError.message || 'Failed to create pool shard',
        variant: 'destructive',
      });
    }
  }, [createShardError, toast]);


  const reset = useCallback(() => {
    setCurrentStep('idle');
    setError(undefined);
    setCreatedPoolAddress(undefined);
  }, []);

  // Handle initializeShard success
  useEffect(() => {
    if (isInitializeShardSuccess && initializeShardHash) {
      console.log('[useBatchCreatePool] Shard initialized, hash:', initializeShardHash);

      toast({
        title: 'Pool Initialized Successfully!',
        description: 'Your pool is now ready for trading',
      });

      setCurrentStep('success');

      if (pendingPromise.current) {
        pendingPromise.current.resolve();
        pendingPromise.current = null;
      }
    }
  }, [isInitializeShardSuccess, initializeShardHash, toast]);

  // Handle initializeShard error
  useEffect(() => {
    if (initializeShardError) {
      console.error('[useBatchCreatePool] Initialize shard error:', initializeShardError);
      setError(initializeShardError as Error);
      setCurrentStep('error');

      if (pendingPromise.current) {
        pendingPromise.current.reject(initializeShardError);
        pendingPromise.current = null;
      }

      toast({
        title: 'Initialization Failed',
        description: initializeShardError.message || 'Failed to initialize pool with liquidity',
        variant: 'destructive',
      });
    }
  }, [initializeShardError, toast]);

  const isLoading =
    token0Approval.isApproving ||
    token1Approval.isApproving ||
    isCreateShardPending ||
    isCreateShardConfirming ||
    isInitializeShardPending ||
    isInitializeShardConfirming;

  return {
    executeBatchCreatePool,
    currentStep,
    steps,
    isLoading,
    error,
    reset,
    createdPoolAddress,
  };
}

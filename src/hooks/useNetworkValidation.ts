import { useChainId, useSwitchChain } from 'wagmi';
import { useCallback } from 'react';
import { riseChain } from '@/config/chains';

interface UseNetworkValidationParams {
  requiredChainId?: number;
}

interface UseNetworkValidationReturn {
  isCorrectNetwork: boolean;
  currentChainId: number | undefined;
  requiredChainId: number;
  switchToCorrectNetwork: () => Promise<void>;
  isLoading: boolean;
}

/**
 * Hook to validate user is on the correct network
 * Defaults to Rise Testnet (Chain ID: 11155931)
 */
export function useNetworkValidation({
  requiredChainId = riseChain.id,
}: UseNetworkValidationParams = {}): UseNetworkValidationReturn {
  const currentChainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  const isCorrectNetwork = currentChainId === requiredChainId;

  const switchToCorrectNetwork = useCallback(async () => {
    if (!switchChain) {
      throw new Error('Network switching not available');
    }

    try {
      await switchChain({ chainId: requiredChainId });
    } catch (error) {
      console.error('Failed to switch network:', error);
      throw error;
    }
  }, [switchChain, requiredChainId]);

  return {
    isCorrectNetwork,
    currentChainId,
    requiredChainId,
    switchToCorrectNetwork,
    isLoading: isPending,
  };
}

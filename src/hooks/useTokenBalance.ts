import { useBalance, useReadContract, useAccount, useChainId } from 'wagmi';
import { Address, formatUnits } from 'viem';
import { Token } from '@/types/tokens';
import { ERC20_ABI, NATIVE_TOKEN_ADDRESS } from '@/utils/constants';
import { isNativeToken } from '@/config/tokens';

/**
 * Hook to fetch token balance for the connected wallet
 */
export function useTokenBalance(token?: Token) {
  const { address: walletAddress } = useAccount();
  const chainId = useChainId();

  // Native token balance (ETH, MATIC, etc.)
  const {
    data: nativeBalance,
    isLoading: nativeLoading,
    refetch: refetchNative,
  } = useBalance({
    address: walletAddress,
    chainId: token?.chainId || chainId,
    query: {
      enabled: !!walletAddress && !!token && isNativeToken(token.address),
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });

  // ERC20 token balance
  const {
    data: erc20Balance,
    isLoading: erc20Loading,
    refetch: refetchERC20,
  } = useReadContract({
    address: token?.address as Address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: walletAddress ? [walletAddress] : undefined,
    chainId: token?.chainId || chainId,
    query: {
      enabled: !!walletAddress && !!token && !isNativeToken(token.address),
      refetchInterval: 30000,
    },
  });

  const refetch = async () => {
    if (!token) return;
    if (isNativeToken(token.address)) {
      await refetchNative();
    } else {
      await refetchERC20();
    }
  };

  if (!token || !walletAddress) {
    return {
      balance: '0',
      balanceFormatted: '0',
      balanceBigInt: BigInt(0),
      isLoading: false,
      refetch,
    };
  }

  const isNative = isNativeToken(token.address);
  const isLoading = isNative ? nativeLoading : erc20Loading;

  if (isNative && nativeBalance) {
    return {
      balance: nativeBalance.value.toString(),
      balanceFormatted: nativeBalance.formatted,
      balanceBigInt: nativeBalance.value,
      isLoading,
      refetch,
    };
  }

  if (!isNative && erc20Balance !== undefined) {
    const formatted = formatUnits(erc20Balance as bigint, token.decimals);
    return {
      balance: (erc20Balance as bigint).toString(),
      balanceFormatted: formatted,
      balanceBigInt: erc20Balance as bigint,
      isLoading,
      refetch,
    };
  }

  return {
    balance: '0',
    balanceFormatted: '0',
    balanceBigInt: BigInt(0),
    isLoading,
    refetch,
  };
}

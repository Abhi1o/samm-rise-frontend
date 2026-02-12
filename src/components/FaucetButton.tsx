import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Droplet, Loader2, Clock, CheckCircle2 } from 'lucide-react';
import { useFaucet } from '@/hooks/useFaucet';
import { riseChain } from '@/config/chains';

/**
 * FaucetButton Component
 *
 * Smart button that allows users to claim test tokens on RiseChain Testnet
 * Features:
 * - Only visible on RiseChain Testnet
 * - Shows cooldown timer when user can't claim
 * - Provides visual feedback for all states
 * - Automatically updates eligibility status
 */
export const FaucetButton = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const [countdown, setCountdown] = useState<string>('');

  const {
    requestTokens,
    canRequest,
    timeUntilNext,
    isPending,
    isSuccess,
    isEnabled,
    formatTimeRemaining,
  } = useFaucet(address, chainId);

  // Update countdown display
  useEffect(() => {
    if (!canRequest && timeUntilNext > 0) {
      const interval = setInterval(() => {
        setCountdown(formatTimeRemaining());
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCountdown('');
    }
  }, [canRequest, timeUntilNext, formatTimeRemaining]);

  // Don't show button if not on RiseChain or no wallet connected
  if (!isEnabled || !address) {
    return null;
  }

  // Get button state
  const getButtonState = () => {
    if (isPending) {
      return {
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        text: 'Claiming...',
        disabled: true,
        variant: 'default' as const,
      };
    }

    if (isSuccess) {
      return {
        icon: <CheckCircle2 className="w-4 h-4" />,
        text: 'Claimed!',
        disabled: true,
        variant: 'default' as const,
      };
    }

    if (!canRequest) {
      return {
        icon: <Clock className="w-4 h-4" />,
        text: countdown || 'Cooldown',
        disabled: true,
        variant: 'secondary' as const,
      };
    }

    return {
      icon: <Droplet className="w-4 h-4" />,
      text: 'Get Test Tokens',
      disabled: false,
      variant: 'swap' as const,
    };
  };

  const buttonState = getButtonState();

  // Tooltip content based on state
  const getTooltipContent = () => {
    if (!canRequest && timeUntilNext > 0) {
      return `Cooldown active. You can claim again in ${countdown}`;
    }

    if (canRequest) {
      return 'Claim free test tokens for SAMM DEX testing (WETH, WBTC, USDC, USDT, DAI, LINK, UNI, AAVE)';
    }

    return 'Loading...';
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            variant={buttonState.variant}
            size="default"
            onClick={requestTokens}
            disabled={buttonState.disabled}
            className="flex items-center gap-2 font-medium transition-all hover:scale-105 active:scale-95"
          >
            {buttonState.icon}
            <span className="hidden sm:inline">{buttonState.text}</span>
            {/* Mobile: Show only icon */}
            <span className="sm:hidden">
              {canRequest ? '💧' : '⏱️'}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-sm">{getTooltipContent()}</p>
          {canRequest && (
            <p className="text-xs text-muted-foreground mt-1">
              Cooldown: 1 hour between claims
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FaucetButton;

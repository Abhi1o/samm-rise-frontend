import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Droplets, Loader2, Clock, CheckCircle2 } from 'lucide-react';
import { useFaucet } from '@/hooks/useFaucet';
import { TokenFaucetModal } from './TokenFaucetModal';

export const FaucetButton = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const [modalOpen, setModalOpen] = useState(false);
  const [countdown, setCountdown] = useState<string>('');

  const {
    canRequest,
    timeUntilNext,
    isPending,
    isSuccess,
    isEnabled,
    formatTimeRemaining,
  } = useFaucet(address, chainId);

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

  if (!isEnabled || !address) return null;

  const getButtonState = () => {
    if (isPending) {
      return {
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        text: 'Claiming...',
        disabled: true,
      };
    }
    if (isSuccess) {
      return {
        icon: <CheckCircle2 className="w-4 h-4" />,
        text: 'Claimed!',
        disabled: true,
      };
    }
    if (!canRequest) {
      return {
        icon: <Clock className="w-4 h-4" />,
        text: countdown || 'Cooldown',
        disabled: false, // still allow opening modal to see timer
      };
    }
    return {
      icon: <Droplets className="w-4 h-4" />,
      text: 'Get Tokens',
      disabled: false,
    };
  };

  const buttonState = getButtonState();

  const tooltipText = !canRequest && timeUntilNext > 0
    ? `Next claim in ${countdown}`
    : 'Claim free test tokens';

  return (
    <>
      <TooltipProvider>
        <Tooltip delayDuration={400}>
          <TooltipTrigger asChild>
            <Button
              variant={canRequest ? 'swap' : 'secondary'}
              size="default"
              onClick={() => setModalOpen(true)}
              disabled={buttonState.disabled}
              className="flex items-center gap-2 font-medium transition-all hover:scale-105 active:scale-95"
            >
              {buttonState.icon}
              <span className="hidden sm:inline">{buttonState.text}</span>
              <span className="sm:hidden">
                {canRequest ? <Droplets className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-sm">{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TokenFaucetModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

export default FaucetButton;

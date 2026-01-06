import { useEffect, useState } from 'react';
import { formatUnits } from 'viem';
import { useTokenFaucet } from '@/hooks/useTokenFaucet';
import { useAccount } from 'wagmi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Droplets, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface TokenFaucetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal component for requesting test tokens from the faucet
 */
export function TokenFaucetModal({ isOpen, onClose }: TokenFaucetModalProps) {
  const { isConnected } = useAccount();
  const {
    canRequest,
    timeUntilNext,
    availableTokens,
    cooldownPeriod,
    requestTokens,
    isLoading,
    faucetState,
    isRequesting,
  } = useTokenFaucet();

  // Debug: Log available tokens
  useEffect(() => {
    if (isOpen) {
      console.log('TokenFaucetModal - availableTokens:', availableTokens);
      console.log('TokenFaucetModal - isLoading:', isLoading);
    }
  }, [isOpen, availableTokens, isLoading]);

  const [countdown, setCountdown] = useState<number>(0);

  // Update countdown every second
  useEffect(() => {
    if (timeUntilNext !== undefined) {
      setCountdown(Number(timeUntilNext));
    }
  }, [timeUntilNext]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  // Format countdown time
  const formatCountdown = (seconds: number): string => {
    if (seconds === 0) return 'Available now';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Format cooldown period
  const formatCooldownPeriod = (seconds: bigint): string => {
    const hours = Number(seconds) / 3600;
    if (hours >= 24) {
      return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const handleRequest = () => {
    requestTokens();
  };

  if (!isConnected) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              Token Faucet
            </DialogTitle>
            <DialogDescription>
              Request test tokens for RiseChain Testnet
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to use the faucet
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            Token Faucet
          </DialogTitle>
          <DialogDescription>
            Request test tokens for RiseChain Testnet
            {cooldownPeriod && (
              <span className="block mt-1 text-xs">
                You can request tokens every {formatCooldownPeriod(cooldownPeriod)}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Available Tokens List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : availableTokens && availableTokens.length > 0 ? (
            (() => {
              const activeTokens = availableTokens.filter((token) => token.isActive);
              return activeTokens.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Available Tokens:</h4>
                  <div className="space-y-2">
                    {activeTokens.map((token) => (
                      <div
                        key={token.tokenAddress}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                      >
                        <span className="font-medium">{token.symbol}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatUnits(token.amount, 18)} tokens
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Alert className="border-yellow-500/50 bg-yellow-500/10">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-500">
                    Faucet is currently inactive. {availableTokens.length} token(s) configured but not active.
                  </AlertDescription>
                </Alert>
              );
            })()
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {availableTokens === undefined
                  ? 'Loading faucet configuration...'
                  : 'No tokens configured in faucet contract'}
              </AlertDescription>
            </Alert>
          )}

          {/* Cooldown Warning */}
          {!canRequest && countdown > 0 && (
            <Alert className="border-orange-500/50 bg-orange-500/10">
              <Clock className="h-4 w-4 text-orange-500" />
              <AlertDescription className="text-orange-500">
                Cooldown active. Next request available in: {formatCountdown(countdown)}
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {faucetState === 'success' && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">
                Tokens successfully received! Check your wallet.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {faucetState === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to request tokens. Please try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Request Button */}
          <Button
            onClick={handleRequest}
            disabled={!canRequest || isRequesting || !availableTokens || availableTokens.length === 0}
            className="w-full"
            size="lg"
          >
            {isRequesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {faucetState === 'requesting' ? 'Signing...' : 'Confirming...'}
              </>
            ) : faucetState === 'success' ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Tokens Received!
              </>
            ) : !canRequest && countdown > 0 ? (
              <>
                <Clock className="mr-2 h-4 w-4" />
                Cooldown Active
              </>
            ) : (
              <>
                <Droplets className="mr-2 h-4 w-4" />
                Request Tokens
              </>
            )}
          </Button>

          {/* Info Text */}
          <p className="text-xs text-center text-muted-foreground">
            Test tokens are only available on testnet networks and have no real value
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

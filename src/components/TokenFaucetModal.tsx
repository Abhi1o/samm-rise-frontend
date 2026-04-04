import { useEffect, useState } from 'react';
import { useTokenFaucet } from '@/hooks/useTokenFaucet';
import { useFaucetTokens } from '@/hooks/useFaucetTokens';
import { useAccount } from 'wagmi';
import { commonTokens } from '@/config/tokens';
import { riseChain } from '@/config/chains';
import TokenLogo from '@/components/TokenLogo';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Droplets, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface TokenFaucetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Sepolia faucet links for test tokens
const SEPOLIA_FAUCETS = {
  ETH: [
    { name: 'Alchemy', url: 'https://www.alchemy.com/faucets/ethereum-sepolia' },
    { name: 'Sepolia Faucet', url: 'https://sepoliafaucet.com/' },
  ],
  LINK: [
    { name: 'Chainlink', url: 'https://faucets.chain.link/sepolia' },
  ],
  USDC: [
    { name: 'Etherscan (mint)', url: 'https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238#writeContract' },
  ],
  USDT: [
    { name: 'Etherscan (mint)', url: 'https://sepolia.etherscan.io/address/0x7169D38820dfd117C3FA1f22a697dBA58d90BA06#writeContract' },
  ],
  DAI: [
    { name: 'Etherscan (mint)', url: 'https://sepolia.etherscan.io/address/0x68194a729C2450ad26072b3D33ADaCbcef39D574#writeContract' },
  ],
};

// Build address → Token metadata map from the known token list
const riseTokenMap = Object.fromEntries(
  (commonTokens[riseChain.id] ?? []).map((t) => [t.address.toLowerCase(), t])
);

/**
 * Human-friendly amount display.
 * Handles dust amounts (< 0.001) without scientific notation.
 */
const formatAmount = (raw: string): string => {
  const num = parseFloat(raw);
  if (!isFinite(num)) return '–';
  if (num === 0) return '0';
  if (num >= 1_000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (num >= 1)     return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  if (num >= 0.001) return num.toFixed(4).replace(/\.?0+$/, '');
  if (num >= 0.000001) return num.toFixed(6).replace(/\.?0+$/, '');
  // Truly tiny – show as dust indicator
  return '< 0.000001';
};

const formatCountdown = (s: number): string => {
  if (s <= 0) return 'Available now';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
};

export function TokenFaucetModal({ isOpen, onClose }: TokenFaucetModalProps) {
  const { isConnected } = useAccount();
  const [showSepoliaFaucets, setShowSepoliaFaucets] = useState(false);

  const {
    canRequest,
    timeUntilNext,
    requestTokens,
    faucetState,
    isRequesting,
  } = useTokenFaucet();

  const { tokens, isLoading: isLoadingTokens } = useFaucetTokens();

  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    if (timeUntilNext !== undefined) setCountdown(Number(timeUntilNext));
  }, [timeUntilNext]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const isSuccess  = faucetState === 'success';
  const isCooldown = !canRequest && countdown > 0;

  // Cooldown progress ring (1 h = 3600 s)
  const radius       = 20;
  const circumference = 2 * Math.PI * radius;
  const elapsed      = isCooldown ? Math.max(0, 1 - countdown / 3600) : 1;
  const dash         = elapsed * circumference;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm p-0 border-border bg-background overflow-hidden gap-0">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-5 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center orange-glow-subtle">
              <Droplets className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground leading-none">Test Token Faucet</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {showSepoliaFaucets ? 'Sepolia Testnet' : 'RiseChain Testnet · 1d cooldown'}
              </p>
            </div>
          </div>
          
          {/* Network Toggle */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setShowSepoliaFaucets(false)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                !showSepoliaFaucets
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-secondary/40 text-muted-foreground border border-border/60 hover:border-border'
              }`}
            >
              RiseChain
            </button>
            <button
              onClick={() => setShowSepoliaFaucets(true)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                showSepoliaFaucets
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-secondary/40 text-muted-foreground border border-border/60 hover:border-border'
              }`}
            >
              Sepolia
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* ── Sepolia Faucets ────────────────────────────────────── */}
          {showSepoliaFaucets ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/8 border border-blue-500/20">
                <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <p className="text-xs text-blue-400">
                  Sepolia tokens are obtained from external faucets. Click the links below to get test tokens.
                </p>
              </div>

              {Object.entries(SEPOLIA_FAUCETS).map(([symbol, faucets]) => (
                <div key={symbol} className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">{symbol}</p>
                  <div className="space-y-2">
                    {faucets.map((faucet) => (
                      <a
                        key={faucet.url}
                        href={faucet.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-4 py-3 rounded-xl bg-secondary/40 border border-border/60 hover:border-primary/50 hover:bg-secondary/60 transition-all group"
                      >
                        <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                          {faucet.name}
                        </span>
                        <svg
                          className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              ))}

              <p className="text-center text-[11px] text-muted-foreground pt-2">
                For ERC-20 tokens (USDC, USDT, DAI), connect your wallet on Etherscan and call the mint function
              </p>
            </div>
          ) : (
            <>
              {/* ── RiseChain Faucet (Original Content) ────────────────────────────────────── */}

          {/* ── Not connected ────────────────────────────────────── */}
          {!isConnected && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/60 border border-border">
              <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <p className="text-sm text-muted-foreground">Connect your wallet to claim tokens</p>
            </div>
          )}

          {isConnected && (
            <>
              {/* ── Token Grid ────────────────────────────────────── */}
              {isLoadingTokens ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : tokens.length > 0 ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                    You will receive
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {tokens.map((token) => {
                      const meta = riseTokenMap[token.address.toLowerCase()];
                      const amount = formatAmount(token.amountPerRequest);

                      return (
                        <div
                          key={token.address}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/60 hover:border-border transition-colors"
                        >
                          <TokenLogo
                            symbol={token.symbol}
                            logoURI={meta?.logoURI}
                            icon={meta?.icon}
                            size="md"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground leading-none">{token.symbol}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{amount}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/60 border border-border">
                  <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">No tokens available right now</p>
                </div>
              )}

              {/* ── Cooldown Ring ─────────────────────────────────── */}
              {isCooldown && (
                <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-orange-500/8 border border-orange-500/20">
                  <div className="relative flex-shrink-0 w-12 h-12">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                      <circle
                        cx="24" cy="24" r={radius}
                        className="fill-none stroke-orange-500/20"
                        strokeWidth="4"
                      />
                      <circle
                        cx="24" cy="24" r={radius}
                        className="fill-none stroke-orange-400"
                        strokeWidth="4"
                        strokeDasharray={`${dash} ${circumference}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <Clock className="absolute inset-0 m-auto w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs text-orange-400 font-medium">Cooldown active</p>
                    <p className="text-sm font-mono font-bold text-foreground tabular-nums">
                      {formatCountdown(countdown)}
                    </p>
                  </div>
                </div>
              )}

              {/* ── Success Banner ────────────────────────────────── */}
              {isSuccess && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/25">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <p className="text-sm text-green-400 font-medium">Tokens received! Check your wallet.</p>
                </div>
              )}

              {/* ── Claim Button ──────────────────────────────────── */}
              <Button
                onClick={requestTokens}
                disabled={!canRequest || isRequesting || isSuccess || tokens.length === 0}
                className="w-full h-11 font-semibold text-sm"
                variant={canRequest && !isSuccess ? 'swap' : 'secondary'}
                size="lg"
              >
                {isRequesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {faucetState === 'requesting' ? 'Confirm in wallet…' : 'Processing…'}
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Tokens Received!
                  </>
                ) : isCooldown ? (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Cooldown Active
                  </>
                ) : (
                  <>
                    <Droplets className="mr-2 h-4 w-4" />
                    Claim All Tokens
                  </>
                )}
              </Button>
            </>
          )}

          <p className="text-center text-[11px] text-muted-foreground">
            Test tokens have no real value · Testnet only
          </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

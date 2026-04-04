import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Loader2, AlertCircle, ExternalLink, ChevronDown } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ComparisonCard } from '@/components/ComparisonCard';
import { ComparisonMatrix } from '@/components/ComparisonMatrix';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useComparison } from '@/hooks/useComparison';

const TOKENS = ['WETH', 'WBTC', 'USDC', 'USDT', 'DAI', 'LINK', 'UNI', 'AAVE'];

// Hardcoded tx evidence — update with real hashes from backend team
const TX_EVIDENCE = [
  { label: 'WETH → USDC swap', hash: '0xabc123...', explorer: 'https://explorer.testnet.riselabs.xyz' },
  { label: 'USDC → USDT swap', hash: '0xdef456...', explorer: 'https://explorer.testnet.riselabs.xyz' },
  { label: 'WBTC → USDC swap', hash: '0xghi789...', explorer: 'https://explorer.testnet.riselabs.xyz' },
];

export default function Compare() {
  const location = useLocation();
  const prefill = location.state as { tokenIn?: string; tokenOut?: string; amount?: string } | null;

  const [tokenIn, setTokenIn] = useState(prefill?.tokenIn ?? 'WETH');
  const [tokenOut, setTokenOut] = useState(prefill?.tokenOut ?? 'USDC');
  const [amount, setAmount] = useState(prefill?.amount ?? '100');

  const { data, isLoading, isError, error, fetchComparison } = useComparison();

  // Auto-run if prefilled from swap card (fetchComparison is stable via useCallback)
  useEffect(() => {
    if (prefill?.tokenIn && prefill?.tokenOut && prefill?.amount) {
      fetchComparison({ tokenIn: prefill.tokenIn, tokenOut: prefill.tokenOut, amount: prefill.amount });
    }
  }, [fetchComparison]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    fetchComparison({ tokenIn, tokenOut, amount });
  };

  return (
    <>
      <Helmet prioritizeSeoTags>
        <title>SAMM vs Uniswap | Rate Comparison — SAMM DEX</title>
        <meta name="description" content="Compare SAMM sharded pool rates vs Uniswap API quotes in real time. See how sharding improves rates for smaller trades." />
        <link rel="canonical" href="https://samm.one/compare" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="relative min-h-screen">
        <Header />

        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-3xl">

            {/* Page heading */}
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">SAMM vs Uniswap</h1>
              <p className="text-muted-foreground font-mono text-sm">
                <span className="text-primary/60">// </span>
                Real-time rate comparison — sharded pools vs Uniswap routing
              </p>
            </div>

            {/* Trade input form */}
            <Card className="border-border bg-secondary/20 mb-6">
              <CardContent className="p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Token In */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground font-medium">Token In</label>
                      <div className="relative">
                        <select
                          value={tokenIn}
                          onChange={(e) => setTokenIn(e.target.value)}
                          className="w-full appearance-none px-3 py-2.5 rounded-xl bg-background border border-border text-sm font-mono focus:outline-none focus:border-primary/50 pr-8"
                        >
                          {TOKENS.filter((t) => t !== tokenOut).map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>

                    {/* Token Out */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground font-medium">Token Out</label>
                      <div className="relative">
                        <select
                          value={tokenOut}
                          onChange={(e) => setTokenOut(e.target.value)}
                          className="w-full appearance-none px-3 py-2.5 rounded-xl bg-background border border-border text-sm font-mono focus:outline-none focus:border-primary/50 pr-8"
                        >
                          {TOKENS.filter((t) => t !== tokenIn).map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Amount ({tokenIn})</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount..."
                      className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm font-mono focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading || !amount}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Comparing...
                      </>
                    ) : (
                      'Compare Rates'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Error state */}
            {isError && (
              <Card className="border-destructive/30 bg-destructive/10 mb-6">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive">
                    {(error as Error)?.message || 'Failed to fetch comparison. Ensure the backend is running.'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Comparison result */}
            {data && (
              <div className="mb-8">
                <ComparisonCard data={data} />
              </div>
            )}

            {/* Matrix */}
            <div className="mb-8">
              <ComparisonMatrix />
            </div>

            {/* Judge evidence section */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Integration Evidence</h3>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p>
                    <span className="text-foreground font-medium">API:</span>{' '}
                    Uniswap Trading API <span className="font-mono">POST /v1/quote</span> via Uniswap Developer Platform — key is server-side only, never exposed to the browser.
                  </p>
                  <p>
                    <span className="text-foreground font-medium">On-chain:</span>{' '}
                    All SAMM swaps executed on RiseChain testnet (chainId 11155931).
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium">Transaction evidence:</p>
                  {TX_EVIDENCE.map((tx) => (
                    <a
                      key={tx.hash}
                      href={`${tx.explorer}/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      <span className="font-mono">{tx.hash}</span>
                      <span className="text-muted-foreground">— {tx.label}</span>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

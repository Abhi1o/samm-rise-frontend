import { Helmet } from 'react-helmet-async';
import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PortfolioOverview } from '@/components/PortfolioOverview';
import { TokenBalancesList } from '@/components/TokenBalancesList';
import { LPPositionsList } from '@/components/LPPositionsList';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Portfolio = () => {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'tokens' | 'positions'>('tokens');

  const { totalValueUSD, tokenBalances, lpPositions, isLoading } = usePortfolioData();

  // Calculate values for overview
  const tokensValueUSD = useMemo(() => {
    return tokenBalances.reduce((sum, tb) => sum + tb.valueUSD, 0);
  }, [tokenBalances]);

  const lpValueUSD = useMemo(() => {
    return lpPositions.reduce((sum, lp) => sum + lp.totalValueUSD, 0);
  }, [lpPositions]);

  return (
    <>
      <Helmet>
        <title>Portfolio - SAMM DEX</title>
        <meta
          name="description"
          content="View your complete portfolio including token balances and LP positions on SAMM DEX"
        />
      </Helmet>

      <div className="relative min-h-screen">
        <Header />

        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">Portfolio</h1>
              <p className="text-muted-foreground">
                Track your token balances and liquidity positions
              </p>
            </div>

            {!isConnected ? (
              /* Not Connected State */
              <div className="glass-card border-glass-border rounded-lg p-8 sm:p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 mb-6">
                  <span className="text-4xl sm:text-5xl">👛</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold mb-3">Connect Your Wallet</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Connect your wallet to view your portfolio, including token balances and liquidity
                  positions
                </p>
                <ConnectButton />
              </div>
            ) : (
              /* Connected - Show Portfolio */
              <div className="space-y-6">
                {/* Portfolio Overview */}
                <PortfolioOverview
                  totalValueUSD={totalValueUSD}
                  tokensCount={tokenBalances.length}
                  positionsCount={lpPositions.length}
                  tokensValueUSD={tokensValueUSD}
                  lpValueUSD={lpValueUSD}
                  isLoading={isLoading}
                />

                {/* Tabs */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 border-b border-glass-border">
                  <button
                    onClick={() => setActiveTab('tokens')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === 'tokens'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Tokens ({tokenBalances.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('positions')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === 'positions'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    LP Positions ({lpPositions.length})
                  </button>

                  <div className="ml-auto pb-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.reload()}
                      className="gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </Button>
                  </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'tokens' && (
                  <div className="animate-fade-in">
                    <TokenBalancesList balances={tokenBalances} isLoading={isLoading} />
                  </div>
                )}

                {activeTab === 'positions' && (
                  <div className="animate-fade-in">
                    <LPPositionsList positions={lpPositions} isLoading={isLoading} />
                  </div>
                )}

                {/* Auto-refresh indicator */}
                {!isLoading && (
                  <p className="text-center text-xs text-muted-foreground">
                    Auto-refreshes every 30 seconds
                  </p>
                )}
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Portfolio;

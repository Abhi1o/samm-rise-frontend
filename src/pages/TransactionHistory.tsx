import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { useAccount } from 'wagmi';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { TransactionFilters } from '@/components/TransactionFilters';
import { TransactionTable } from '@/components/TransactionTable';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import { TransactionFilters as TxFilters } from '@/types/transaction';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useBlockchainSync } from '@/hooks/useBlockchainSync';

const TransactionHistory = () => {
  const { isConnected } = useAccount();
  const {
    transactions,
    isLoading,
    filteredTransactions,
    applyFilters,
  } = useTransactionHistory();
  const { syncRecentTransactions, isSyncing } = useBlockchainSync();

  const [filters, setFilters] = useState<TxFilters>({
    type: 'all',
    status: 'all',
    searchQuery: '',
  });

  const handleFiltersChange = (newFilters: TxFilters) => {
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const handleRefresh = async () => {
    await syncRecentTransactions();
    window.location.reload();
  };

  return (
    <>
      <Helmet prioritizeSeoTags>
        <title>Transaction History | SAMM DEX — Your DeFi Activity on RiseChain</title>
        <meta name="description" content="View your complete transaction history on SAMM DEX including token swaps, liquidity additions, removals, and contract approvals on RiseChain." />
        <link rel="canonical" href="https://samm.one/history" />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Transaction History | SAMM DEX" />
        <meta property="og:description" content="View your complete DeFi transaction history on SAMM DEX on RiseChain." />
        <meta property="og:url" content="https://samm.one/history" />
      </Helmet>

      <div className="relative min-h-screen">
        <Header />

        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            {/* Page Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">Transaction History</h1>
                <p className="text-muted-foreground">
                  Track all your swaps, liquidity operations, and approvals
                </p>
              </div>

              {isConnected && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isSyncing}
                  title="Refresh transactions from blockchain"
                  className="self-start sm:self-auto"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>

            {!isConnected ? (
              /* Not Connected State */
              <div className="glass-card border-glass-border rounded-lg p-8 sm:p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 mb-6">
                  <span className="text-4xl sm:text-5xl">📝</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold mb-3">Connect Your Wallet</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Connect your wallet to view your transaction history across all networks
                </p>
                <ConnectButton />
              </div>
            ) : (
              /* Connected - Show History */
              <div className="space-y-6">
                {/* Filters */}
                <div className="glass-card border-glass-border rounded-lg p-4 sm:p-6">
                  <TransactionFilters filters={filters} onFiltersChange={handleFiltersChange} />
                </div>

                {/* Transactions Table */}
                <TransactionTable
                  transactions={filteredTransactions}
                  isLoading={isLoading}
                />

                {/* Results Count */}
                {!isLoading && transactions.length > 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    Showing {filteredTransactions.length} of {transactions.length} transactions
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

export default TransactionHistory;

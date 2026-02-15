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
      <Helmet>
        <title>Transaction History - SAMM DEX</title>
        <meta
          name="description"
          content="View your complete transaction history on SAMM DEX including swaps, liquidity operations, and approvals"
        />
      </Helmet>

      <div className="relative min-h-screen">
        <Header />

        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            {/* Page Header */}
            <div className="mb-8 flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Transaction History</h1>
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
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>

            {!isConnected ? (
              /* Not Connected State */
              <div className="glass-card border-glass-border rounded-lg p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                  <span className="text-5xl">📝</span>
                </div>
                <h2 className="text-2xl font-bold mb-3">Connect Your Wallet</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Connect your wallet to view your transaction history across all networks
                </p>
                <ConnectButton />
              </div>
            ) : (
              /* Connected - Show History */
              <div className="space-y-6">
                {/* Filters */}
                <div className="glass-card border-glass-border rounded-lg p-6">
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

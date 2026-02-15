import { useState } from 'react';
import { StoredTransaction } from '@/types/transaction';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { formatRelativeTime } from '@/utils/formatters';
import { ExternalLink, CheckCircle2, Clock, XCircle, ArrowRight, Plus, Minus, Check, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { useChainId } from 'wagmi';
import { riseChain } from '@/config/chains';

interface TransactionTableProps {
  transactions: StoredTransaction[];
  isLoading?: boolean;
}

export function TransactionTable({ transactions, isLoading }: TransactionTableProps) {
  const [selectedTx, setSelectedTx] = useState<StoredTransaction | null>(null);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const chainId = useChainId();

  const toggleExpand = (txId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTxId(expandedTxId === txId ? null : txId);
  };

  const getStatusIcon = (status: StoredTransaction['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getTypeIcon = (type: StoredTransaction['type']) => {
    switch (type) {
      case 'swap':
        return <ArrowRight className="w-4 h-4" />;
      case 'add_liquidity':
        return <Plus className="w-4 h-4" />;
      case 'remove_liquidity':
        return <Minus className="w-4 h-4" />;
      case 'approval':
        return <Check className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: StoredTransaction['type']) => {
    switch (type) {
      case 'swap':
        return 'Swap';
      case 'add_liquidity':
        return 'Add Liquidity';
      case 'remove_liquidity':
        return 'Remove Liquidity';
      case 'approval':
        return 'Approval';
    }
  };

  const getExplorerUrl = (hash: string) => {
    // Use RiseChain testnet explorer
    if (chainId === riseChain.id) {
      return `https://explorer.testnet.riselabs.xyz/tx/${hash}`;
    }
    return `https://etherscan.io/tx/${hash}`;
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-glass-border">
        <CardContent className="pt-6">
          <div className="space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="glass-card border-glass-border">
        <CardContent className="pt-12 pb-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <span className="text-3xl">📝</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
            <p className="text-sm text-muted-foreground">
              Your transaction history will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass-card border-glass-border">
        <CardContent className="pt-6">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Details
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Time
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <>
                    <tr
                      key={tx.id}
                      className="border-b border-glass-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={(e) => toggleExpand(tx.id, e)}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => toggleExpand(tx.id, e)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {expandedTxId === tx.id ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                          {getTypeIcon(tx.type)}
                          <span className="font-medium">{getTypeLabel(tx.type)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {tx.swapData && (
                          <span className="text-sm">
                            {tx.swapData.fromToken} → {tx.swapData.toToken}
                          </span>
                        )}
                        {tx.liquidityData && (
                          <span className="text-sm">
                            {tx.liquidityData.token0}-{tx.liquidityData.token1}
                          </span>
                        )}
                        {tx.approvalData && (
                          <span className="text-sm">{tx.approvalData.token}</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(tx.status)}
                          <Badge
                            variant={
                              tx.status === 'success'
                                ? 'default'
                                : tx.status === 'pending'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {tx.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-muted-foreground">
                          {formatRelativeTime(tx.timestamp)}
                        </span>
                      </td>
                      <td className="text-right py-4 px-4">
                        <a
                          href={getExplorerUrl(tx.hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                    {expandedTxId === tx.id && (
                      <tr key={`${tx.id}-expanded`} className="border-b border-glass-border/50 bg-muted/20">
                        <td colSpan={5} className="py-6 px-4">
                          <div className="space-y-4 max-w-4xl">
                            <h4 className="font-semibold text-sm mb-3">Transaction Details</h4>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Transaction Hash</span>
                                <p className="font-mono text-xs mt-1 break-all">{tx.hash}</p>
                              </div>

                              <div>
                                <span className="text-muted-foreground">Timestamp</span>
                                <p className="mt-1">{new Date(tx.timestamp).toLocaleString()}</p>
                              </div>

                              <div>
                                <span className="text-muted-foreground">Status</span>
                                <div className="flex items-center gap-2 mt-1">
                                  {getStatusIcon(tx.status)}
                                  <span className="capitalize">{tx.status}</span>
                                </div>
                              </div>

                              <div>
                                <span className="text-muted-foreground">Chain</span>
                                <p className="mt-1">Chain ID: {tx.chainId}</p>
                              </div>
                            </div>

                            {tx.swapData && (
                              <div className="grid grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t border-glass-border/50">
                                <div>
                                  <span className="text-muted-foreground">From</span>
                                  <p className="mt-1 font-medium">
                                    {tx.swapData.fromAmount} {tx.swapData.fromToken}
                                  </p>
                                </div>

                                <div>
                                  <span className="text-muted-foreground">To</span>
                                  <p className="mt-1 font-medium">
                                    {tx.swapData.toAmount} {tx.swapData.toToken}
                                  </p>
                                </div>

                                {tx.swapData.route && (
                                  <div className="col-span-2">
                                    <span className="text-muted-foreground">Route</span>
                                    <p className="mt-1 text-xs">
                                      {tx.swapData.route.join(' → ')}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {tx.liquidityData && (
                              <div className="grid grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t border-glass-border/50">
                                <div>
                                  <span className="text-muted-foreground">Pool</span>
                                  <p className="mt-1 font-medium">
                                    {tx.liquidityData.token0}-{tx.liquidityData.token1}
                                  </p>
                                </div>

                                <div>
                                  <span className="text-muted-foreground">Amounts</span>
                                  <div className="mt-1">
                                    <p className="text-xs">
                                      {tx.liquidityData.amount0} {tx.liquidityData.token0}
                                    </p>
                                    <p className="text-xs">
                                      {tx.liquidityData.amount1} {tx.liquidityData.token1}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2 mt-4 pt-4 border-t border-glass-border/50">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(getExplorerUrl(tx.hash), '_blank')}
                              >
                                <ExternalLink className="w-3 h-3 mr-2" />
                                View on Explorer
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigator.clipboard.writeText(tx.hash)}
                              >
                                Copy Hash
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="p-4 rounded-lg border border-glass-border bg-card/50 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(tx.type)}
                    <span className="font-medium">{getTypeLabel(tx.type)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(tx.status)}
                    <Badge
                      variant={
                        tx.status === 'success'
                          ? 'default'
                          : tx.status === 'pending'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-sm space-y-1">
                  {tx.swapData && (
                    <p>
                      {tx.swapData.fromAmount} {tx.swapData.fromToken} → {tx.swapData.toAmount}{' '}
                      {tx.swapData.toToken}
                    </p>
                  )}
                  {tx.liquidityData && (
                    <p>
                      {tx.liquidityData.token0}-{tx.liquidityData.token1} Pool
                    </p>
                  )}
                  <p className="text-muted-foreground">{formatRelativeTime(tx.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <div className="flex items-center gap-2">
                  {getTypeIcon(selectedTx.type)}
                  <span className="font-medium">{getTypeLabel(selectedTx.type)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedTx.status)}
                  <Badge
                    variant={
                      selectedTx.status === 'success'
                        ? 'default'
                        : selectedTx.status === 'pending'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {selectedTx.status}
                  </Badge>
                </div>
              </div>

              {selectedTx.swapData && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">From</span>
                    <span className="font-medium">
                      {selectedTx.swapData.fromAmount} {selectedTx.swapData.fromToken}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">To</span>
                    <span className="font-medium">
                      {selectedTx.swapData.toAmount} {selectedTx.swapData.toToken}
                    </span>
                  </div>
                </>
              )}

              {selectedTx.liquidityData && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pool</span>
                    <span className="font-medium">
                      {selectedTx.liquidityData.token0}-{selectedTx.liquidityData.token1}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Amounts</span>
                    <div className="text-right">
                      <div className="font-medium">
                        {selectedTx.liquidityData.amount0} {selectedTx.liquidityData.token0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedTx.liquidityData.amount1} {selectedTx.liquidityData.token1}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Time</span>
                <span className="text-sm">{new Date(selectedTx.timestamp).toLocaleString()}</span>
              </div>

              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Hash</span>
                <span className="text-sm font-mono text-right break-all">
                  {selectedTx.hash.slice(0, 10)}...{selectedTx.hash.slice(-8)}
                </span>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(getExplorerUrl(selectedTx.hash), '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Explorer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

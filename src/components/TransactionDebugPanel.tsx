import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { transactionStorage } from '@/services/transactionStorage';

/**
 * Debug panel for transaction history
 * Shows localStorage contents and helps diagnose issues
 */
export function TransactionDebugPanel() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const runDiagnostics = () => {
    if (!address) {
      setDebugInfo({ error: 'No wallet connected' });
      return;
    }

    // Get all localStorage keys related to transactions
    const allKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('samm_transaction_history')) {
        allKeys.push(key);
      }
    }

    // Get transactions for current address/chain
    const currentTransactions = chainId
      ? transactionStorage.getTransactions(address, chainId)
      : [];

    // Get all transactions for current address across all chains
    const allUserTransactions = transactionStorage.getAllUserTransactions(address);

    // Get raw localStorage data
    const rawData: Record<string, any> = {};
    allKeys.forEach(key => {
      const data = localStorage.getItem(key);
      rawData[key] = data ? JSON.parse(data) : null;
    });

    setDebugInfo({
      address,
      chainId,
      currentTransactionsCount: currentTransactions.length,
      allUserTransactions,
      allKeys,
      rawData,
    });

    console.log('Transaction Debug Info:', {
      address,
      chainId,
      currentTransactions,
      allUserTransactions,
      allKeys,
      rawData,
    });
  };

  return (
    <Card className="glass-card border-glass-border">
      <CardHeader>
        <CardTitle className="text-lg">Transaction History Debug Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={runDiagnostics} className="w-full">
            Run Diagnostics
          </Button>

          {debugInfo && (
            <div className="text-xs font-mono space-y-2">
              {debugInfo.error ? (
                <div className="text-red-500">{debugInfo.error}</div>
              ) : (
                <>
                  <div>
                    <strong>Address:</strong> {debugInfo.address}
                  </div>
                  <div>
                    <strong>Chain ID:</strong> {debugInfo.chainId || 'undefined'}
                  </div>
                  <div>
                    <strong>Current Chain Transactions:</strong>{' '}
                    {debugInfo.currentTransactionsCount}
                  </div>
                  <div>
                    <strong>All localStorage Keys:</strong>
                    <div className="ml-4">
                      {debugInfo.allKeys.length === 0
                        ? 'No transaction keys found'
                        : debugInfo.allKeys.map((key: string) => <div key={key}>- {key}</div>)}
                    </div>
                  </div>
                  <div>
                    <strong>All User Transactions (by chain):</strong>
                    <div className="ml-4">
                      {Object.keys(debugInfo.allUserTransactions).length === 0 ? (
                        <div>No transactions found</div>
                      ) : (
                        Object.entries(debugInfo.allUserTransactions).map(
                          ([chain, txs]: [string, any]) => (
                            <div key={chain}>
                              Chain {chain}: {txs.length} transactions
                            </div>
                          )
                        )
                      )}
                    </div>
                  </div>
                  <details>
                    <summary className="cursor-pointer text-primary hover:underline">
                      View Raw Data
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-96">
                      {JSON.stringify(debugInfo.rawData, null, 2)}
                    </pre>
                  </details>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

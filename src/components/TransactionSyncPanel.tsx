import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Download, Hash, RefreshCw } from 'lucide-react';
import { useBlockchainSync } from '@/hooks/useBlockchainSync';

interface TransactionSyncPanelProps {
  onSyncComplete?: () => void;
}

/**
 * Panel for syncing transactions from the blockchain
 */
export function TransactionSyncPanel({ onSyncComplete }: TransactionSyncPanelProps) {
  const [txHash, setTxHash] = useState('');
  const { syncTransactionByHash, syncRecentTransactions, isSyncing } = useBlockchainSync();

  const handleSyncByHash = async () => {
    if (!txHash.trim()) return;

    const success = await syncTransactionByHash(txHash.trim());
    if (success) {
      setTxHash('');
      onSyncComplete?.();
    }
  };

  const handleAutoSync = async () => {
    await syncRecentTransactions();
    onSyncComplete?.();
  };

  return (
    <Card className="glass-card border-glass-border">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Download className="w-5 h-5" />
          Sync Transactions from Blockchain
        </CardTitle>
        <CardDescription>
          Automatically restore your transaction history from the blockchain. No manual work required!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Auto Sync Button */}
          <div>
            <Button
              onClick={handleAutoSync}
              disabled={isSyncing}
              className="w-full gap-2"
              size="lg"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing from Blockchain...' : 'Auto Sync All Transactions'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Automatically fetches and restores all your past transactions from the blockchain
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-glass-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or sync by hash</span>
            </div>
          </div>

          {/* Manual Sync by Hash */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter transaction hash (0x...)"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                disabled={isSyncing}
                className="font-mono text-sm"
              />
            </div>
            <Button
              onClick={handleSyncByHash}
              disabled={!txHash.trim() || isSyncing}
              variant="outline"
              className="gap-2"
            >
              <Hash className="w-4 h-4" />
              {isSyncing ? 'Syncing...' : 'Sync'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            💡 All synced transactions are saved to your browser's local storage for future access
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState, useCallback } from 'react';
import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { Address } from 'viem';
import { blockchainSyncService } from '@/services/blockchainSync';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to sync transactions from blockchain
 */
export function useBlockchainSync() {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  /**
   * Sync a transaction by hash
   */
  const syncTransactionByHash = useCallback(
    async (txHash: string): Promise<boolean> => {
      if (!address || !chainId || !publicClient) {
        toast({
          title: 'Cannot Sync',
          description: 'Please connect your wallet',
          variant: 'destructive',
        });
        return false;
      }

      setIsSyncing(true);

      try {
        const success = await blockchainSyncService.syncTransactionByHash(
          publicClient,
          txHash as Address,
          address,
          chainId
        );

        if (success) {
          toast({
            title: 'Transaction Synced!',
            description: 'Transaction added to your history',
          });
          return true;
        } else {
          toast({
            title: 'Sync Failed',
            description: 'Could not sync this transaction. Make sure the hash is correct and the transaction is on the current chain.',
            variant: 'destructive',
          });
          return false;
        }
      } catch (error: any) {
        console.error('[useBlockchainSync] Error syncing transaction:', error);
        toast({
          title: 'Sync Error',
          description: error.message || 'Failed to sync transaction',
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [address, chainId, publicClient, toast]
  );

  /**
   * Sync recent transactions from blockchain
   * Note: This is limited due to lack of events. See service for details.
   */
  const syncRecentTransactions = useCallback(async (): Promise<number> => {
    if (!address || !chainId || !publicClient) {
      toast({
        title: 'Cannot Sync',
        description: 'Please connect your wallet',
        variant: 'destructive',
      });
      return 0;
    }

    setIsSyncing(true);

    try {
      const syncedTxs = await blockchainSyncService.syncRecentTransactions(
        publicClient,
        address,
        chainId
      );

      if (syncedTxs.length > 0) {
        toast({
          title: 'Sync Complete!',
          description: `Synced ${syncedTxs.length} transaction(s)`,
        });
      } else {
        toast({
          title: 'No New Transactions',
          description: 'No new transactions found to sync',
        });
      }

      return syncedTxs.length;
    } catch (error: any) {
      console.error('[useBlockchainSync] Error syncing recent transactions:', error);
      toast({
        title: 'Sync Error',
        description: error.message || 'Failed to sync transactions',
        variant: 'destructive',
      });
      return 0;
    } finally {
      setIsSyncing(false);
    }
  }, [address, chainId, publicClient, toast]);

  return {
    syncTransactionByHash,
    syncRecentTransactions,
    isSyncing,
  };
}

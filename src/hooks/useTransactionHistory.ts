import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { transactionStorage } from '@/services/transactionStorage';
import {
  StoredTransaction,
  TransactionStatus,
  TransactionFilters,
  TransactionHistoryResult,
} from '@/types/transaction';

/**
 * Hook to manage transaction history with localStorage persistence
 */
export function useTransactionHistory(): TransactionHistoryResult {
  const { address } = useAccount();
  const chainId = useChainId();

  const [transactions, setTransactions] = useState<StoredTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<TransactionFilters>({
    type: 'all',
    status: 'all',
    searchQuery: '',
  });

  // Load transactions from localStorage on mount and when address/chain changes
  useEffect(() => {
    if (!address) {
      console.log('[useTransactionHistory] No address connected');
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    if (!chainId) {
      console.log('[useTransactionHistory] No chainId available');
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log('[useTransactionHistory] Loading transactions for:', { address, chainId });
      const storedTransactions = transactionStorage.getTransactions(address, chainId);
      console.log('[useTransactionHistory] Loaded transactions:', storedTransactions.length);

      // Debug: log all transactions for this user across all chains
      const allTransactions = transactionStorage.getAllUserTransactions(address);
      console.log('[useTransactionHistory] All user transactions:', allTransactions);

      setTransactions(storedTransactions);
    } catch (error) {
      console.error('[useTransactionHistory] Error loading transactions:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [address, chainId]);

  /**
   * Save a new transaction
   */
  const saveTransaction = useCallback(
    (tx: Omit<StoredTransaction, 'id'>) => {
      if (!address) {
        console.warn('[useTransactionHistory] Cannot save transaction: No address');
        return;
      }

      if (!chainId) {
        console.warn('[useTransactionHistory] Cannot save transaction: No chainId');
        return;
      }

      try {
        console.log('[useTransactionHistory] Saving transaction:', { address, chainId, tx });
        const savedTx = transactionStorage.saveTransaction(address, chainId, tx);
        console.log('[useTransactionHistory] Transaction saved successfully:', savedTx.id);

        // Update local state
        setTransactions(prev => [savedTx, ...prev]);
      } catch (error) {
        console.error('[useTransactionHistory] Error saving transaction:', error);
      }
    },
    [address, chainId]
  );

  /**
   * Update transaction status
   */
  const updateStatus = useCallback(
    (hash: string, status: TransactionStatus) => {
      if (!address) return;

      try {
        transactionStorage.updateTransactionStatus(address, chainId, hash, status);

        // Update local state
        setTransactions(prev =>
          prev.map(tx =>
            tx.hash.toLowerCase() === hash.toLowerCase() ? { ...tx, status } : tx
          )
        );
      } catch (error) {
        console.error('[useTransactionHistory] Error updating status:', error);
      }
    },
    [address, chainId]
  );

  /**
   * Clear all transaction history
   */
  const clearHistory = useCallback(() => {
    if (!address) return;

    try {
      transactionStorage.clearHistory(address, chainId);
      setTransactions([]);
    } catch (error) {
      console.error('[useTransactionHistory] Error clearing history:', error);
    }
  }, [address, chainId]);

  /**
   * Apply filters to transactions
   */
  const applyFilters = useCallback((newFilters: TransactionFilters) => {
    setFilters(newFilters);
  }, []);

  /**
   * Filtered transactions based on current filters
   */
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Filter by type
    if (filters.type && filters.type !== 'all') {
      result = result.filter(tx => tx.type === filters.type);
    }

    // Filter by status
    if (filters.status && filters.status !== 'all') {
      result = result.filter(tx => tx.status === filters.status);
    }

    // Filter by search query (transaction hash)
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const query = filters.searchQuery.toLowerCase().trim();
      result = result.filter(tx => tx.hash.toLowerCase().includes(query));
    }

    return result;
  }, [transactions, filters]);

  return {
    transactions,
    isLoading,
    saveTransaction,
    updateStatus,
    clearHistory,
    filteredTransactions,
    applyFilters,
  };
}

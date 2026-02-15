import { StoredTransaction, TransactionStatus } from '@/types/transaction';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'samm_transaction_history';
const MAX_TRANSACTIONS = 1000; // Prevent localStorage quota issues

/**
 * Transaction storage service using localStorage
 */
class TransactionStorage {
  /**
   * Get storage key for specific user and chain
   */
  private getKey(userAddress: string, chainId: number): string {
    return `${STORAGE_KEY}_${userAddress.toLowerCase()}_${chainId}`;
  }

  /**
   * Get all transactions for a specific user and chain
   */
  getTransactions(userAddress: string, chainId: number): StoredTransaction[] {
    try {
      const key = this.getKey(userAddress, chainId);
      console.log('[TransactionStorage] Getting transactions with key:', key);
      const data = localStorage.getItem(key);

      if (!data) {
        console.log('[TransactionStorage] No transactions found in localStorage for key:', key);
        return [];
      }

      const transactions: StoredTransaction[] = JSON.parse(data);
      console.log('[TransactionStorage] Found transactions:', transactions.length);

      // Sort by timestamp descending (newest first)
      return transactions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('[TransactionStorage] Error reading transactions:', error);
      return [];
    }
  }

  /**
   * Save a new transaction
   */
  saveTransaction(
    userAddress: string,
    chainId: number,
    transaction: Omit<StoredTransaction, 'id'>
  ): StoredTransaction {
    try {
      const key = this.getKey(userAddress, chainId);
      console.log('[TransactionStorage] Saving transaction with key:', key);
      const transactions = this.getTransactions(userAddress, chainId);

      // Create transaction with UUID
      const newTransaction: StoredTransaction = {
        ...transaction,
        id: uuidv4(),
        userAddress: userAddress.toLowerCase(),
      };

      console.log('[TransactionStorage] Created new transaction:', newTransaction);

      // Add to beginning of array (newest first)
      transactions.unshift(newTransaction);

      // Trim to MAX_TRANSACTIONS to prevent quota issues
      const trimmed = transactions.slice(0, MAX_TRANSACTIONS);

      // Save to localStorage
      localStorage.setItem(key, JSON.stringify(trimmed));
      console.log('[TransactionStorage] Saved to localStorage. Total transactions:', trimmed.length);

      return newTransaction;
    } catch (error) {
      console.error('[TransactionStorage] Error saving transaction:', error);

      // If quota exceeded, try clearing old transactions
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('[TransactionStorage] Quota exceeded, clearing old transactions');
        this.clearOldTransactions(userAddress, chainId, 100); // Keep only last 100

        // Retry save
        return this.saveTransaction(userAddress, chainId, transaction);
      }

      throw error;
    }
  }

  /**
   * Update transaction status by hash
   */
  updateTransactionStatus(
    userAddress: string,
    chainId: number,
    hash: string,
    status: TransactionStatus
  ): void {
    try {
      const key = this.getKey(userAddress, chainId);
      const transactions = this.getTransactions(userAddress, chainId);

      // Find and update transaction
      const index = transactions.findIndex(tx => tx.hash.toLowerCase() === hash.toLowerCase());

      if (index === -1) {
        console.warn(`[TransactionStorage] Transaction not found: ${hash}`);
        return;
      }

      transactions[index].status = status;

      // Save updated list
      localStorage.setItem(key, JSON.stringify(transactions));
    } catch (error) {
      console.error('[TransactionStorage] Error updating transaction status:', error);
    }
  }

  /**
   * Clear all transactions for a specific user and chain
   */
  clearHistory(userAddress: string, chainId: number): void {
    try {
      const key = this.getKey(userAddress, chainId);
      localStorage.removeItem(key);
    } catch (error) {
      console.error('[TransactionStorage] Error clearing history:', error);
    }
  }

  /**
   * Clear old transactions, keeping only the most recent N
   */
  private clearOldTransactions(
    userAddress: string,
    chainId: number,
    keepCount: number
  ): void {
    try {
      const key = this.getKey(userAddress, chainId);
      const transactions = this.getTransactions(userAddress, chainId);

      // Keep only the most recent transactions
      const trimmed = transactions.slice(0, keepCount);

      localStorage.setItem(key, JSON.stringify(trimmed));
    } catch (error) {
      console.error('[TransactionStorage] Error clearing old transactions:', error);
    }
  }

  /**
   * Get a single transaction by hash
   */
  getTransaction(
    userAddress: string,
    chainId: number,
    hash: string
  ): StoredTransaction | undefined {
    const transactions = this.getTransactions(userAddress, chainId);
    return transactions.find(tx => tx.hash.toLowerCase() === hash.toLowerCase());
  }

  /**
   * Get all transactions across all chains for a user (for debugging)
   */
  getAllUserTransactions(userAddress: string): Record<number, StoredTransaction[]> {
    const result: Record<number, StoredTransaction[]> = {};
    const lowerAddress = userAddress.toLowerCase();

    try {
      // Scan all localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith(STORAGE_KEY)) continue;

        // Extract chainId from key format: samm_transaction_history_<address>_<chainId>
        const parts = key.split('_');
        const chainId = parseInt(parts[parts.length - 1]);
        const address = parts[parts.length - 2];

        if (address === lowerAddress && !isNaN(chainId)) {
          result[chainId] = this.getTransactions(userAddress, chainId);
        }
      }

      return result;
    } catch (error) {
      console.error('[TransactionStorage] Error getting all user transactions:', error);
      return {};
    }
  }
}

// Export singleton instance
export const transactionStorage = new TransactionStorage();

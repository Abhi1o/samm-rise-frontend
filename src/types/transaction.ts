/**
 * Transaction types
 */
export type TransactionType = 'swap' | 'add_liquidity' | 'remove_liquidity' | 'approval';

/**
 * Transaction status
 */
export type TransactionStatus = 'pending' | 'success' | 'failed';

/**
 * Swap transaction data
 */
export interface SwapData {
  fromToken: string;      // Token symbol (e.g., "USDC")
  toToken: string;        // Token symbol (e.g., "USDT")
  fromAmount: string;     // Formatted amount
  toAmount: string;       // Formatted amount
  route?: string[];       // Multi-hop route if applicable
}

/**
 * Liquidity transaction data
 */
export interface LiquidityData {
  pool: string;           // Pool address or name
  token0: string;         // Token symbol
  token1: string;         // Token symbol
  amount0: string;        // Formatted amount
  amount1: string;        // Formatted amount
  lpTokens?: string;      // LP tokens received/removed
}

/**
 * Approval transaction data
 */
export interface ApprovalData {
  token: string;          // Token symbol
  spender: string;        // Spender contract address
  amount: string;         // Approval amount ("infinite" or specific)
}

/**
 * Stored transaction record
 */
export interface StoredTransaction {
  id: string;                     // Unique UUID
  hash: string;                   // Transaction hash
  type: TransactionType;
  status: TransactionStatus;
  timestamp: number;              // Unix timestamp (milliseconds)
  chainId: number;
  userAddress: string;            // Lowercase address

  // Type-specific data (only one will be populated based on type)
  swapData?: SwapData;
  liquidityData?: LiquidityData;
  approvalData?: ApprovalData;
}

/**
 * Transaction filter options
 */
export interface TransactionFilters {
  type?: TransactionType | 'all';
  status?: TransactionStatus | 'all';
  searchQuery?: string;           // Search by transaction hash
}

/**
 * Transaction history hook return type
 */
export interface TransactionHistoryResult {
  transactions: StoredTransaction[];
  isLoading: boolean;
  saveTransaction: (tx: Omit<StoredTransaction, 'id'>) => void;
  updateStatus: (hash: string, status: TransactionStatus) => void;
  clearHistory: () => void;
  filteredTransactions: StoredTransaction[];
  applyFilters: (filters: TransactionFilters) => void;
}

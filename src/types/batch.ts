/**
 * Batch transaction step types for multi-step operations
 */

/**
 * Batch swap steps
 */
export type BatchSwapStep =
  | 'idle'           // Not started
  | 'checking'       // Checking if approval needed
  | 'approving'      // Approval transaction in progress
  | 'approved'       // Approval confirmed
  | 'swapping'       // Swap transaction in progress
  | 'success'        // All steps completed
  | 'error';         // Error occurred

/**
 * Batch add liquidity steps
 */
export type BatchLiquidityStep =
  | 'idle'               // Not started
  | 'checking'           // Checking approvals needed
  | 'approving_token0'   // Token0 approval in progress
  | 'approved_token0'    // Token0 approved
  | 'approving_token1'   // Token1 approval in progress
  | 'approved_token1'    // Token1 approved
  | 'adding_liquidity'   // Add liquidity in progress
  | 'success'            // All steps completed
  | 'error';             // Error occurred

/**
 * Progress step for UI display
 */
export interface ProgressStep {
  label: string;                                    // Display label
  status: 'pending' | 'active' | 'complete' | 'error';
  hash?: string;                                    // Transaction hash when available
}

/**
 * Batch swap hook return type
 */
export interface UseBatchSwapReturn {
  executeBatchSwap: () => Promise<void>;
  currentStep: BatchSwapStep;
  steps: ProgressStep[];
  isLoading: boolean;
  error?: Error;
  reset: () => void;
}

/**
 * Batch add liquidity hook return type
 */
export interface UseBatchAddLiquidityReturn {
  executeBatchAddLiquidity: () => Promise<void>;
  currentStep: BatchLiquidityStep;
  steps: ProgressStep[];
  isLoading: boolean;
  error?: Error;
  reset: () => void;
}

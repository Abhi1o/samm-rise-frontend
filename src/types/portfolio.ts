import { Token } from './tokens';
import { UserPosition } from '@/hooks/useUserPositions';

/**
 * Token balance with USD value information
 */
export interface TokenBalanceWithValue {
  token: Token;
  balance: string;           // Raw balance in wei/smallest unit
  balanceFormatted: string;  // Formatted for display
  priceUSD: number;          // Current price in USD
  valueUSD: number;          // Total value (balance * price)
  priceChange24h?: number;   // 24h price change percentage
}

/**
 * LP position with USD value information
 */
export interface LPPositionWithValue extends UserPosition {
  token0ValueUSD: number;    // USD value of token0 amount
  token1ValueUSD: number;    // USD value of token1 amount
  totalValueUSD: number;     // Total USD value of position
}

/**
 * Complete portfolio data for a user
 */
export interface PortfolioData {
  totalValueUSD: number;                   // Total portfolio value in USD
  tokenBalances: TokenBalanceWithValue[];  // All token balances
  lpPositions: LPPositionWithValue[];      // All LP positions
  isLoading: boolean;                      // Loading state
  error?: Error;                           // Error if any
}

/**
 * Portfolio summary statistics
 */
export interface PortfolioStats {
  totalAssets: number;       // Total number of assets held
  totalPositions: number;    // Total number of LP positions
  totalValueUSD: number;     // Total portfolio value
  tokensValueUSD: number;    // Total value in tokens
  lpValueUSD: number;        // Total value in LP positions
}

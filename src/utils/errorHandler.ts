/**
 * Parse blockchain errors and return user-friendly messages
 */
export function parseBlockchainError(error: any): string {
  // Handle different error types
  const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';

  // User rejected transaction
  if (
    errorMessage.includes('User rejected') ||
    errorMessage.includes('user rejected') ||
    errorMessage.includes('User denied') ||
    errorMessage.includes('user denied')
  ) {
    return 'Transaction was rejected. Please try again.';
  }

  // Insufficient funds/balance
  if (
    errorMessage.includes('insufficient funds') ||
    errorMessage.includes('insufficient balance') ||
    errorMessage.includes('exceeds balance')
  ) {
    return 'Insufficient balance to complete this transaction.';
  }

  // Insufficient gas
  if (
    errorMessage.includes('insufficient gas') ||
    errorMessage.includes('out of gas') ||
    errorMessage.includes('gas required exceeds allowance')
  ) {
    return 'Insufficient gas to complete this transaction. Try increasing your gas limit.';
  }

  // Slippage exceeded
  if (
    errorMessage.includes('slippage') ||
    errorMessage.includes('INSUFFICIENT_OUTPUT_AMOUNT') ||
    errorMessage.includes('Too little received')
  ) {
    return 'Price slippage exceeded tolerance. Try increasing slippage or waiting for better market conditions.';
  }

  // Network/RPC errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout')
  ) {
    return 'Network connection error. Please check your connection and try again.';
  }

  // Contract revert errors
  if (errorMessage.includes('revert') || errorMessage.includes('reverted')) {
    if (errorMessage.includes('STF')) {
      return 'Token transfer failed. The token contract may have restrictions.';
    }
    if (errorMessage.includes('Pair')) {
      return 'Liquidity pair not found or insufficient liquidity.';
    }
    return 'Transaction failed. The contract rejected the transaction.';
  }

  // Deadline exceeded
  if (errorMessage.includes('deadline') || errorMessage.includes('expired')) {
    return 'Transaction deadline exceeded. Please try again.';
  }

  // Nonce errors
  if (errorMessage.includes('nonce')) {
    return 'Transaction nonce error. Please reset your wallet and try again.';
  }

  // Gas price too low
  if (errorMessage.includes('replacement transaction underpriced')) {
    return 'Gas price too low. Please increase gas price and try again.';
  }

  // Chain mismatch
  if (
    errorMessage.includes('chain') ||
    errorMessage.includes('network') ||
    errorMessage.includes('wrong network')
  ) {
    return 'Wrong network. Please switch to the correct network.';
  }

  // Token approval errors
  if (errorMessage.includes('approval') || errorMessage.includes('allowance')) {
    return 'Token approval failed. Please try approving the token again.';
  }

  // Permit signature errors
  if (errorMessage.includes('permit') || errorMessage.includes('signature')) {
    return 'Signature verification failed. Please try again.';
  }

  // Transaction already known/pending
  if (
    errorMessage.includes('already known') ||
    errorMessage.includes('already pending')
  ) {
    return 'Transaction is already pending. Please wait for it to complete.';
  }

  // Rate limiting
  if (
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests')
  ) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Generic fallback
  if (errorMessage.length > 100) {
    return 'Transaction failed. Please try again or contact support.';
  }

  return errorMessage;
}

/**
 * Get error severity level
 */
export function getErrorSeverity(error: any): 'info' | 'warning' | 'error' {
  const errorMessage = error?.message || error?.toString() || '';

  // User actions (not really errors)
  if (
    errorMessage.includes('User rejected') ||
    errorMessage.includes('user rejected')
  ) {
    return 'info';
  }

  // Warnings (recoverable)
  if (
    errorMessage.includes('slippage') ||
    errorMessage.includes('deadline') ||
    errorMessage.includes('gas')
  ) {
    return 'warning';
  }

  // Errors (need action)
  return 'error';
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  const errorMessage = error?.message || error?.toString() || '';

  const retryableErrors = [
    'network',
    'connection',
    'timeout',
    'rate limit',
    'too many requests',
    'nonce',
  ];

  return retryableErrors.some((keyword) =>
    errorMessage.toLowerCase().includes(keyword)
  );
}

/**
 * Log error with context
 */
export function logError(
  error: any,
  context?: string,
  metadata?: Record<string, any>
) {
  const errorMessage = parseBlockchainError(error);
  const severity = getErrorSeverity(error);

  console.error(`[${severity.toUpperCase()}]${context ? ` ${context}:` : ''}`, {
    message: errorMessage,
    originalError: error,
    metadata,
  });
}

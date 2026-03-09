export interface ParsedError {
  title: string;
  description: string;
  technicalDetails?: string;
  actions: Array<{
    label: string;
    action: 'retry' | 'openFaucet' | 'openRiseFaucet' | 'close' | 'switchNetwork';
    variant?: 'default' | 'destructive' | 'outline';
  }>;
}

/**
 * Parse contract errors into user-friendly messages with actionable steps
 */
export function parseError(error: any): ParsedError {
  const message = error.message.toLowerCase();

  // Insufficient ETH for gas
  if (message.includes('insufficient funds') || message.includes('insufficient balance for transfer')) {
    return {
      title: 'Insufficient token for Gas',
      description: 'You need at least some gas fees for pool creation.',
      technicalDetails: error.message,
      actions: [
        { label: 'Get Testnet ETH', action: 'openRiseFaucet' },
        { label: 'Close', action: 'close', variant: 'outline' },
      ],
    };
  }

  // Insufficient token balance
  if (message.includes('erc20') && (message.includes('transfer amount exceeds balance') || message.includes('insufficient'))) {
    return {
      title: 'Insufficient Token Balance',
      description: 'You don\'t have enough tokens for this transaction. Use the faucet to get test tokens.',
      technicalDetails: error.message,
      actions: [
        { label: 'Get Test Tokens', action: 'openFaucet' },
        { label: 'Close', action: 'close', variant: 'outline' },
      ],
    };
  }

  // User rejected transaction
  if (message.includes('user rejected') || message.includes('user denied') || message.includes('user cancelled')) {
    return {
      title: 'Transaction Cancelled',
      description: 'You cancelled the transaction in your wallet.',
      actions: [
        { label: 'Try Again', action: 'retry' },
        { label: 'Close', action: 'close', variant: 'outline' },
      ],
    };
  }

  // Wrong network
  if (message.includes('chain') && (message.includes('mismatch') || message.includes('unsupported'))) {
    return {
      title: 'Wrong Network',
      description: 'Please switch to Rise Testnet to continue.',
      technicalDetails: error.message,
      actions: [
        { label: 'Switch Network', action: 'switchNetwork' },
        { label: 'Close', action: 'close', variant: 'outline' },
      ],
    };
  }

  // Pool already exists
  if (message.includes('pool') && message.includes('exists')) {
    return {
      title: 'Pool Already Exists',
      description: 'A pool for this token pair has already been created.',
      technicalDetails: error.message,
      actions: [
        { label: 'Close', action: 'close' },
      ],
    };
  }

  // Slippage / price movement
  if (
    message.includes('slippage') ||
    message.includes('price impact') ||
    message.includes('exceeds max') ||
    message.includes('amountoutmin') ||
    message.includes('too little received') ||
    message.includes('insufficient output amount')
  ) {
    return {
      title: 'Slippage Exceeded',
      description: 'The price moved too much before your transaction was confirmed. Try increasing slippage tolerance or swap a smaller amount.',
      technicalDetails: error.message,
      actions: [
        { label: 'Try Again', action: 'retry' },
        { label: 'Close', action: 'close', variant: 'outline' },
      ],
    };
  }

  // Insufficient liquidity in pool
  if (
    message.includes('insufficient liquidity') ||
    message.includes('liquidity') ||
    message.includes('k invariant') ||
    message.includes('reserve')
  ) {
    return {
      title: 'Insufficient Liquidity',
      description: 'This pool doesn\'t have enough liquidity for your trade. Try a smaller amount or a different token pair.',
      technicalDetails: error.message,
      actions: [
        { label: 'Try Again', action: 'retry' },
        { label: 'Close', action: 'close', variant: 'outline' },
      ],
    };
  }

  // Token allowance too low
  if (message.includes('allowance') || message.includes('not approved') || message.includes('transfer amount exceeds allowance')) {
    return {
      title: 'Approval Required',
      description: 'Token spending approval is needed before swapping. Please approve and try again.',
      technicalDetails: error.message,
      actions: [
        { label: 'Try Again', action: 'retry' },
        { label: 'Close', action: 'close', variant: 'outline' },
      ],
    };
  }

  // Generic contract revert
  if (message.includes('execution reverted') || message.includes('revert')) {
    return {
      title: 'Transaction Failed',
      description: 'The transaction was reverted by the contract. This might be due to invalid parameters or contract state.',
      technicalDetails: error.message,
      actions: [
        { label: 'Try Again', action: 'retry' },
        { label: 'Close', action: 'close', variant: 'outline' },
      ],
    };
  }

  // Transaction timeout
  if (message.includes('timeout') || message.includes('timed out')) {
    return {
      title: 'Transaction Timeout',
      description: 'The transaction took too long to complete. The network might be congested.',
      technicalDetails: error.message,
      actions: [
        { label: 'Try Again', action: 'retry' },
        { label: 'Close', action: 'close', variant: 'outline' },
      ],
    };
  }

  // Generic error
  return {
    title: 'Transaction Failed',
    description: error.message || 'An unexpected error occurred. Please try again.',
    technicalDetails: error.message,
    actions: [
      { label: 'Try Again', action: 'retry' },
      { label: 'Close', action: 'close', variant: 'outline' },
    ],
  };
}

/**
 * Check if error is user rejection (don't show error toast for these)
 */
export function isUserRejection(error: any): boolean {
  if (!error) return false;
  const errorString = (error.message || error.toString()).toLowerCase();
  return (
    errorString.includes('user rejected') ||
    errorString.includes('user denied') ||
    errorString.includes('user cancelled') ||
    errorString.includes('rejected the request')
  );
}

/**
 * Format error for toast notification
 */
export function formatErrorForToast(error: any) {
  const parsed = parseError(error);
  
  return {
    title: parsed.title,
    description: parsed.description,
    variant: 'destructive' as const,
  };
}

/**
 * Get short error message for inline display
 */
export function getShortErrorMessage(error: any): string {
  const parsed = parseError(error);
  return parsed.description;
}

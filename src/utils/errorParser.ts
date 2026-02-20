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
export function parseContractError(error: Error): ParsedError {
  const message = error.message.toLowerCase();

  // Insufficient ETH for gas
  if (message.includes('insufficient funds') || message.includes('insufficient balance for transfer')) {
    return {
      title: 'Insufficient ETH for Gas',
      description: 'You need at least 0.001 ETH to cover gas fees for pool creation.',
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

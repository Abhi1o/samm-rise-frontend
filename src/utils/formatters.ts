import { formatUnits, parseUnits } from 'viem';

/**
 * Format an address to display format (0x1234...5678)
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`;
}

/**
 * Format a token amount with proper decimals
 */
export function formatTokenAmount(
  amount: bigint | string | number,
  decimals: number = 18,
  displayDecimals: number = 6
): string {
  try {
    const amountBigInt = typeof amount === 'bigint' ? amount : BigInt(amount.toString());
    const formatted = formatUnits(amountBigInt, decimals);
    const num = parseFloat(formatted);

    if (num === 0) return '0';
    if (num < 0.000001) return '< 0.000001';

    // For large numbers, use compact notation
    if (num >= 1000000) {
      return formatCompactNumber(num);
    }

    // For small numbers, show more precision
    if (num < 1) {
      return num.toFixed(displayDecimals).replace(/\.?0+$/, '');
    }

    // For regular numbers
    return num.toFixed(Math.min(displayDecimals, 2)).replace(/\.?0+$/, '');
  } catch (error) {
    console.error('Error formatting token amount:', error);
    return '0';
  }
}

/**
 * Format USD value
 */
export function formatUSD(value: number | string, compact = false): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return '$0.00';
  if (num === 0) return '$0.00';
  if (num < 0.01) return '< $0.01';

  if (compact && num >= 1000000) {
    return `$${formatCompactNumber(num)}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format compact numbers (1.2M, 3.4B, etc.)
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`;
  }
  return value.toFixed(2);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 2): string {
  if (isNaN(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format percentage change with + or -
 */
export function formatPercentageChange(value: number, decimals = 2): string {
  if (isNaN(value)) return '0%';
  const formatted = formatPercentage(Math.abs(value), decimals);
  return value >= 0 ? `+${formatted}` : `-${formatted}`;
}

/**
 * Parse input value to BigInt with proper decimals
 */
export function parseTokenAmount(value: string, decimals: number = 18): bigint {
  try {
    if (!value || value === '' || value === '.') return BigInt(0);
    return parseUnits(value, decimals);
  } catch (error) {
    console.error('Error parsing token amount:', error);
    return BigInt(0);
  }
}

/**
 * Format time estimate (in seconds) to human-readable format
 */
export function formatTimeEstimate(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`;
  return `${Math.ceil(seconds / 3600)}h`;
}

/**
 * Format timestamp to relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

/**
 * Format block explorer URL for a transaction
 */
export function getExplorerUrl(
  chainId: number,
  hash: string,
  type: 'tx' | 'address' | 'token' = 'tx'
): string {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io',
    10: 'https://optimistic.etherscan.io',
    137: 'https://polygonscan.com',
    8453: 'https://basescan.org',
    42161: 'https://arbiscan.io',
  };

  const baseUrl = explorers[chainId] || explorers[1];
  const path = type === 'tx' ? 'tx' : type === 'address' ? 'address' : 'token';

  return `${baseUrl}/${path}/${hash}`;
}

/**
 * Truncate long text in the middle
 */
export function truncateMiddle(text: string, startChars = 10, endChars = 8): string {
  if (!text || text.length <= startChars + endChars) return text;
  return `${text.substring(0, startChars)}...${text.substring(text.length - endChars)}`;
}

/**
 * Format large numbers with commas
 */
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

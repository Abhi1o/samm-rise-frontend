// Default slippage values
export const DEFAULT_SLIPPAGE = 0.5; // 0.5%
export const SLIPPAGE_OPTIONS = [0.1, 0.5, 1.0, 3.0];

// Transaction deadline (in minutes)
export const DEFAULT_DEADLINE = 20;

// Refresh intervals (in milliseconds)
export const BALANCE_REFRESH_INTERVAL = 30000; // 30 seconds
export const PRICE_REFRESH_INTERVAL = 30000; // 30 seconds
export const QUOTE_REFRESH_INTERVAL = 10000; // 10 seconds
export const TRANSACTION_POLL_INTERVAL = 2000; // 2 seconds

// Debounce delays (in milliseconds)
export const QUOTE_DEBOUNCE_DELAY = 500;
export const SEARCH_DEBOUNCE_DELAY = 300;

// API endpoints
export const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

// Price impact warning thresholds
export const PRICE_IMPACT_WARNING = 3; // 3%
export const PRICE_IMPACT_CRITICAL = 5; // 5%

// Maximum approval amount (effectively unlimited)
export const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

// Common zero addresses
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// Native token placeholder address (used for ETH, MATIC, etc.)
export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

// ERC20 ABI for basic operations
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
] as const;

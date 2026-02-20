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
export const COINCAP_API_URL = 'https://api.coincap.io/v2';
export const CRYPTOCOMPARE_API_URL = 'https://min-api.cryptocompare.com/data';
export const BINANCE_API_URL = 'https://api.binance.com/api/v3';

// Price impact warning thresholds
export const PRICE_IMPACT_WARNING = 3; // 3%
export const PRICE_IMPACT_CRITICAL = 5; // 5%

// Maximum approval amount (effectively unlimited)
export const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

// Common zero addresses
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// Native token placeholder address (used for ETH, MATIC, etc.)
export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

// Contract addresses on RiseChain Testnet
// Updated 2026-02-12 - New faucet with correct token addresses
export const TOKEN_FAUCET_ADDRESS = '0x1758716f8ccb77B514d801eF00C690F6F5CFce84';
export const SAMM_FACTORY_ADDRESS = '0x1114cF606d700bB8490C9D399500e35a31FaE27A';
export const CROSS_POOL_ROUTER_ADDRESS = '0x622c2D2719197A047f29BCBaaaEBBDbD54b45a11';

/**
 * Explicit gas limits for RiseChain transactions.
 * RiseChain's eth_estimateGas returns values that exceed the network's
 * acceptable threshold, causing "gas limit too high" errors. Setting
 * explicit gas bypasses estimation entirely.
 * 
 * NOTE: For swaps, gas limit is calculated dynamically based on number of hops:
 * - 1 hop (direct): 400,000 gas
 * - 2 hops: 1,000,000 gas
 * - 3 hops: 1,500,000 gas
 * - 4 hops: 2,000,000 gas
 */
export const GAS_LIMITS = {
  approve: 100_000n,           // ERC20 approve
  swap: 600_000n,              // DEPRECATED: Use dynamic calculation in useSwapExecution
  addLiquidity: 400_000n,      // addLiquidity
  removeLiquidity: 300_000n,   // removeLiquidity
  createShard: 3_000_000n,     // createShard / createShardDefault (deploys contract)
  initializeShard: 600_000n,   // initializeShard (transfers + storage)
} as const;

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

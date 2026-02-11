/**
 * Contract ABIs for SAMM Protocol
 */

export const CROSS_POOL_ROUTER_ABI = [
  {
    inputs: [
      {
        components: [
          {
            components: [
              { internalType: 'address', name: 'tokenIn', type: 'address' },
              { internalType: 'address', name: 'tokenOut', type: 'address' },
              { internalType: 'uint256', name: 'amountOut', type: 'uint256' },
            ],
            internalType: 'struct ICrossPoolRouter.Hop[]',
            name: 'hops',
            type: 'tuple[]',
          },
          { internalType: 'uint256', name: 'maxAmountIn', type: 'uint256' },
          { internalType: 'uint256', name: 'deadline', type: 'uint256' },
          { internalType: 'address', name: 'recipient', type: 'address' },
        ],
        internalType: 'struct ICrossPoolRouter.SwapParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'swapExactOutput',
    outputs: [{ internalType: 'uint256', name: 'amountIn', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              { internalType: 'address', name: 'tokenIn', type: 'address' },
              { internalType: 'address', name: 'tokenOut', type: 'address' },
              { internalType: 'uint256', name: 'amountOut', type: 'uint256' },
            ],
            internalType: 'struct ICrossPoolRouter.Hop[]',
            name: 'hops',
            type: 'tuple[]',
          },
          { internalType: 'uint256', name: 'maxAmountIn', type: 'uint256' },
        ],
        internalType: 'struct ICrossPoolRouter.QuoteParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'quoteSwap',
    outputs: [
      { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      { internalType: 'address[]', name: 'pools', type: 'address[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const TOKEN_FAUCET_ABI = [
  {
    inputs: [],
    name: 'requestTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'canRequest',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'timeUntilNextRequest',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAllTokens',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'tokenAddress', type: 'address' },
          { internalType: 'string', name: 'symbol', type: 'string' },
          { internalType: 'uint256', name: 'amount', type: 'uint256' },
          { internalType: 'bool', name: 'isActive', type: 'bool' },
        ],
        internalType: 'struct TokenFaucet.TokenInfo[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'cooldownPeriod',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const SAMM_POOL_ABI = [
  // ERC20 LP Token functions
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  // SAMM Pool functions
  {
    inputs: [],
    name: 'getReserves',
    outputs: [
      { internalType: 'uint256', name: 'reserve0', type: 'uint256' },
      { internalType: 'uint256', name: 'reserve1', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token0',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token1',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'sammParams',
    outputs: [
      { internalType: 'uint256', name: 'gamma', type: 'uint256' },
      { internalType: 'uint256', name: 'lambda', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'amountADesired', type: 'uint256' },
      { internalType: 'uint256', name: 'amountBDesired', type: 'uint256' },
      { internalType: 'uint256', name: 'amountAMin', type: 'uint256' },
      { internalType: 'uint256', name: 'amountBMin', type: 'uint256' },
      { internalType: 'address', name: 'to', type: 'address' },
    ],
    name: 'addLiquidity',
    outputs: [
      { internalType: 'uint256', name: 'amountA', type: 'uint256' },
      { internalType: 'uint256', name: 'amountB', type: 'uint256' },
      { internalType: 'uint256', name: 'liquidity', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'liquidity', type: 'uint256' },
      { internalType: 'uint256', name: 'amountAMin', type: 'uint256' },
      { internalType: 'uint256', name: 'amountBMin', type: 'uint256' },
      { internalType: 'address', name: 'to', type: 'address' },
    ],
    name: 'removeLiquidity',
    outputs: [
      { internalType: 'uint256', name: 'amountA', type: 'uint256' },
      { internalType: 'uint256', name: 'amountB', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tokenA',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tokenB',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getPoolState',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'tokenA', type: 'address' },
          { internalType: 'address', name: 'tokenB', type: 'address' },
          { internalType: 'uint256', name: 'reserveA', type: 'uint256' },
          { internalType: 'uint256', name: 'reserveB', type: 'uint256' },
          { internalType: 'uint256', name: 'totalSupply', type: 'uint256' },
          { internalType: 'uint256', name: 'tradeFeeNumerator', type: 'uint256' },
          { internalType: 'uint256', name: 'tradeFeeDenominator', type: 'uint256' },
          { internalType: 'uint256', name: 'ownerFeeNumerator', type: 'uint256' },
          { internalType: 'uint256', name: 'ownerFeeDenominator', type: 'uint256' },
        ],
        internalType: 'struct ISAMMPool.PoolState',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Export individual ABIs with proper names
export const SAMMPoolABI = SAMM_POOL_ABI;
export const CrossPoolRouterABI = CROSS_POOL_ROUTER_ABI;
export const TokenFaucetABI = TOKEN_FAUCET_ABI;

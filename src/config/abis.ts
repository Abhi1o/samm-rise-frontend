/**
 * CrossPoolRouter ABI
 * For executing multi-hop swaps across SAMM pools
 */
export const CROSS_POOL_ROUTER_ABI = [
  {
    inputs: [
      {
        components: [
          {
            components: [
              { name: 'tokenIn', type: 'address' },
              { name: 'tokenOut', type: 'address' },
              { name: 'amountOut', type: 'uint256' },
            ],
            name: 'hops',
            type: 'tuple[]',
          },
          { name: 'maxAmountIn', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'recipient', type: 'address' },
        ],
        name: 'path',
        type: 'tuple',
      },
    ],
    name: 'swapExactOutput',
    outputs: [
      {
        components: [
          {
            components: [
              { name: 'pool', type: 'address' },
              { name: 'tokenIn', type: 'address' },
              { name: 'tokenOut', type: 'address' },
              { name: 'amountIn', type: 'uint256' },
              { name: 'amountOut', type: 'uint256' },
              { name: 'fee', type: 'uint256' },
            ],
            name: 'hopResults',
            type: 'tuple[]',
          },
          { name: 'totalAmountIn', type: 'uint256' },
          { name: 'totalAmountOut', type: 'uint256' },
          { name: 'totalFees', type: 'uint256' },
        ],
        name: 'result',
        type: 'tuple',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountOut', type: 'uint256' },
        ],
        name: 'hops',
        type: 'tuple[]',
      },
    ],
    name: 'quoteSwap',
    outputs: [
      {
        components: [
          { name: 'expectedAmountIn', type: 'uint256' },
          { name: 'hopAmountsIn', type: 'uint256[]' },
          { name: 'hopFees', type: 'uint256[]' },
          { name: 'selectedShards', type: 'address[]' },
          { name: 'priceImpacts', type: 'uint256[]' },
        ],
        name: 'result',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * TokenFaucet ABI
 * For requesting test tokens on testnet
 */
export const TOKEN_FAUCET_ABI = [
  {
    inputs: [],
    name: 'requestTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'recipient', type: 'address' }],
    name: 'requestTokensFor',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'canRequest',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'timeUntilNextRequest',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAllTokens',
    outputs: [
      {
        components: [
          { name: 'tokenAddress', type: 'address' },
          { name: 'symbol', type: 'string' },
          { name: 'amountPerRequest', type: 'uint256' },
          { name: 'decimals', type: 'uint8' },
        ],
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
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'lastRequestTime',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * SAMMPool ABI (basic interface for reading pool state)
 */
export const SAMM_POOL_ABI = [
  {
    inputs: [],
    name: 'getReserves',
    outputs: [
      { name: 'reserveA', type: 'uint256' },
      { name: 'reserveB', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tokenA',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tokenB',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'lpToken',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

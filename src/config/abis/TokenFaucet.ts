export const TokenFaucetABI = [
  {
    inputs: [],
    name: 'requestTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'recipient', type: 'address' }],
    name: 'requestTokensFor',
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
          { internalType: 'uint256', name: 'amountPerRequest', type: 'uint256' },
          { internalType: 'uint8', name: 'decimals', type: 'uint8' },
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
  {
    inputs: [],
    name: 'getTokenCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * TokenFaucet contract address on RiseChain Testnet
 * Updated 2026-02-12 - New faucet with correct token addresses
 */
export const TOKEN_FAUCET_ADDRESS = '0x1758716f8ccb77B514d801eF00C690F6F5CFce84' as const;

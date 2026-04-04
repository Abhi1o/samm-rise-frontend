import { Token } from '@/types/tokens';
import { NATIVE_TOKEN_ADDRESS } from '@/utils/constants';
import { mainnet, arbitrum, optimism, polygon, base } from 'wagmi/chains';
import { riseChain } from './chains';

/**
 * Native tokens for each chain
 */
export const nativeTokens: Record<number, Token> = {
  [riseChain.id]: {
    symbol: 'ETH',
    name: 'Ether',
    address: NATIVE_TOKEN_ADDRESS,
    decimals: 18,
    chainId: riseChain.id,
    icon: '⟠',
    logoURI: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
    coingeckoId: 'ethereum',
  },
  [mainnet.id]: {
    symbol: 'ETH',
    name: 'Ether',
    address: NATIVE_TOKEN_ADDRESS,
    decimals: 18,
    chainId: mainnet.id,
    icon: '⟠',
    logoURI: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
    coingeckoId: 'ethereum',
  },
  [arbitrum.id]: {
    symbol: 'ETH',
    name: 'Ether',
    address: NATIVE_TOKEN_ADDRESS,
    decimals: 18,
    chainId: arbitrum.id,
    icon: '⟠',
    coingeckoId: 'ethereum',
  },
  [optimism.id]: {
    symbol: 'ETH',
    name: 'Ether',
    address: NATIVE_TOKEN_ADDRESS,
    decimals: 18,
    chainId: optimism.id,
    icon: '⟠',
    coingeckoId: 'ethereum',
  },
  [polygon.id]: {
    symbol: 'MATIC',
    name: 'Polygon',
    address: NATIVE_TOKEN_ADDRESS,
    decimals: 18,
    chainId: polygon.id,
    icon: '🟣',
    coingeckoId: 'matic-network',
  },
  [base.id]: {
    symbol: 'ETH',
    name: 'Ether',
    address: NATIVE_TOKEN_ADDRESS,
    decimals: 18,
    chainId: base.id,
    icon: '⟠',
    coingeckoId: 'ethereum',
  },
  [11155111]: {
    symbol: 'ETH',
    name: 'Ether',
    address: NATIVE_TOKEN_ADDRESS,
    decimals: 18,
    chainId: 11155111,
    icon: '⟠',
    logoURI: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
    coingeckoId: 'ethereum',
  },
};

/**
 * Common tokens by chain
 */
export const commonTokens: Record<number, Token[]> = {
  // RiseChain Testnet - Updated 2026-03-29
  [riseChain.id]: [
    {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0x0234367975aCbcBe49867dD36bf37C7d05C2E743',
      decimals: 18,
      chainId: riseChain.id,
      icon: '⟠',
      logoURI: 'https://assets.coingecko.com/coins/images/2518/standard/weth.png',
      coingeckoId: 'weth',
    },
    {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      address: '0xD35648Ad048e450aFd22f3421cE6A5EFFC40DC4D',
      decimals: 8,
      chainId: riseChain.id,
      icon: '₿',
      logoURI: 'https://assets.coingecko.com/coins/images/7598/standard/wrapped_bitcoin_wbtc.png',
      coingeckoId: 'wrapped-bitcoin',
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x1B40c25A7cDF5b11c67dc956d6b63EEaE1C349B0',
      decimals: 6,
      chainId: riseChain.id,
      icon: '💲',
      logoURI: 'https://assets.coingecko.com/coins/images/6319/standard/usdc.png',
      coingeckoId: 'usd-coin',
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0xa95558713D7E6D3F41bC70E867323A84404586f9',
      decimals: 6,
      chainId: riseChain.id,
      icon: '💵',
      logoURI: 'https://assets.coingecko.com/coins/images/325/standard/Tether.png',
      coingeckoId: 'tether',
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      address: '0x51A046A489da585eB5875845FdC7323c0f1F0606',
      decimals: 18,
      chainId: riseChain.id,
      icon: '◈',
      logoURI: 'https://assets.coingecko.com/coins/images/9956/standard/Badge_Dai.png',
      coingeckoId: 'dai',
    },
  ],

  // Ethereum Mainnet
  [mainnet.id]: [
    nativeTokens[mainnet.id],
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
      chainId: mainnet.id,
      icon: '💲',
      coingeckoId: 'usd-coin',
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      decimals: 6,
      chainId: mainnet.id,
      icon: '💵',
      coingeckoId: 'tether',
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      decimals: 18,
      chainId: mainnet.id,
      icon: '◈',
      coingeckoId: 'dai',
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      decimals: 18,
      chainId: mainnet.id,
      icon: '⟠',
      coingeckoId: 'weth',
    },
    {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      decimals: 8,
      chainId: mainnet.id,
      icon: '₿',
      coingeckoId: 'wrapped-bitcoin',
    },
  ],

  // Arbitrum
  [arbitrum.id]: [
    nativeTokens[arbitrum.id],
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      decimals: 6,
      chainId: arbitrum.id,
      icon: '💲',
      coingeckoId: 'usd-coin',
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      decimals: 6,
      chainId: arbitrum.id,
      icon: '💵',
      coingeckoId: 'tether',
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      decimals: 18,
      chainId: arbitrum.id,
      icon: '◈',
      coingeckoId: 'dai',
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      decimals: 18,
      chainId: arbitrum.id,
      icon: '⟠',
      coingeckoId: 'weth',
    },
    {
      symbol: 'ARB',
      name: 'Arbitrum',
      address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
      decimals: 18,
      chainId: arbitrum.id,
      icon: '🔵',
      coingeckoId: 'arbitrum',
    },
  ],

  // Optimism
  [optimism.id]: [
    nativeTokens[optimism.id],
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
      decimals: 6,
      chainId: optimism.id,
      icon: '💲',
      coingeckoId: 'usd-coin',
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
      decimals: 6,
      chainId: optimism.id,
      icon: '💵',
      coingeckoId: 'tether',
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      decimals: 18,
      chainId: optimism.id,
      icon: '◈',
      coingeckoId: 'dai',
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0x4200000000000000000000000000000000000006',
      decimals: 18,
      chainId: optimism.id,
      icon: '⟠',
      coingeckoId: 'weth',
    },
    {
      symbol: 'OP',
      name: 'Optimism',
      address: '0x4200000000000000000000000000000000000042',
      decimals: 18,
      chainId: optimism.id,
      icon: '🔴',
      coingeckoId: 'optimism',
    },
  ],

  // Polygon
  [polygon.id]: [
    nativeTokens[polygon.id],
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      decimals: 6,
      chainId: polygon.id,
      icon: '💲',
      coingeckoId: 'usd-coin',
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      decimals: 6,
      chainId: polygon.id,
      icon: '💵',
      coingeckoId: 'tether',
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      decimals: 18,
      chainId: polygon.id,
      icon: '◈',
      coingeckoId: 'dai',
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      decimals: 18,
      chainId: polygon.id,
      icon: '⟠',
      coingeckoId: 'weth',
    },
    {
      symbol: 'WMATIC',
      name: 'Wrapped Matic',
      address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      decimals: 18,
      chainId: polygon.id,
      icon: '🟣',
      coingeckoId: 'wmatic',
    },
  ],

  // Base
  [base.id]: [
    nativeTokens[base.id],
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      decimals: 6,
      chainId: base.id,
      icon: '💲',
      coingeckoId: 'usd-coin',
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      decimals: 18,
      chainId: base.id,
      icon: '◈',
      coingeckoId: 'dai',
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0x4200000000000000000000000000000000000006',
      decimals: 18,
      chainId: base.id,
      icon: '⟠',
      coingeckoId: 'weth',
    },
  ],

  // Sepolia Testnet (for Uniswap swaps)
  [11155111]: [
    {
      symbol: 'ETH',
      name: 'Ether',
      address: NATIVE_TOKEN_ADDRESS,
      decimals: 18,
      chainId: 11155111,
      icon: '⟠',
      logoURI: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
      coingeckoId: 'ethereum',
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
      decimals: 18,
      chainId: 11155111,
      icon: '⟠',
      logoURI: 'https://assets.coingecko.com/coins/images/2518/standard/weth.png',
      coingeckoId: 'weth',
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      decimals: 6,
      chainId: 11155111,
      icon: '💲',
      logoURI: 'https://assets.coingecko.com/coins/images/6319/standard/usdc.png',
      coingeckoId: 'usd-coin',
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
      decimals: 6,
      chainId: 11155111,
      icon: '💵',
      logoURI: 'https://assets.coingecko.com/coins/images/325/standard/Tether.png',
      coingeckoId: 'tether',
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      address: '0x68194a729C2450ad26072b3D33ADaCbcef39D574',
      decimals: 18,
      chainId: 11155111,
      icon: '◈',
      logoURI: 'https://assets.coingecko.com/coins/images/9956/standard/Badge_Dai.png',
      coingeckoId: 'dai',
    },
    {
      symbol: 'LINK',
      name: 'Chainlink',
      address: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
      decimals: 18,
      chainId: 11155111,
      icon: '🔗',
      logoURI: 'https://assets.coingecko.com/coins/images/877/standard/chainlink-new-logo.png',
      coingeckoId: 'chainlink',
    },
  ],
};

/**
 * Get tokens for a specific chain
 */
export function getTokensForChain(chainId: number): Token[] {
  return commonTokens[chainId] || [];
}

/**
 * Get native token for a chain
 */
export function getNativeToken(chainId: number): Token | undefined {
  return nativeTokens[chainId];
}

/**
 * Find token by address on a specific chain
 */
export function findToken(chainId: number, address: string): Token | undefined {
  const tokens = getTokensForChain(chainId);
  return tokens.find(
    (t) => t.address.toLowerCase() === address.toLowerCase()
  );
}

/**
 * Check if an address is the native token
 */
export function isNativeToken(address: string | undefined): boolean {
  if (!address) return false;
  return address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase();
}

/**
 * Get all unique tokens across all chains (for search)
 */
export function getAllTokens(): Token[] {
  const allTokens: Token[] = [];
  Object.values(commonTokens).forEach((tokens) => {
    allTokens.push(...tokens);
  });
  return allTokens;
}

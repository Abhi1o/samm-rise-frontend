import { ChainMetadata } from '@/types/web3';
import { mainnet, arbitrum, optimism, polygon, base } from 'wagmi/chains';
import { defineChain } from 'viem';
import type { Chain } from 'viem';

/**
 * RiseChain Testnet
 */
export const riseChain = defineChain({
  id: 11155931,
  name: 'RiseChain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.riselabs.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.testnet.riselabs.xyz' },
  },
  testnet: true,
}) as Chain;

/**
 * Extended chain metadata for UI display
 * Maps to the NETWORKS array from Header.tsx
 */
export const chainMetadata: Record<number, ChainMetadata> = {
  // RiseChain Testnet
  [riseChain.id]: {
    id: riseChain.id,
    name: 'RiseChain',
    icon: '/assets/image/riselogo.png',
    color: 'bg-orange-500',
    rpcUrl: riseChain.rpcUrls.default.http[0],
    blockExplorer: 'https://explorer.testnet.riselabs.xyz',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  // Ethereum Mainnet
  [mainnet.id]: {
    id: mainnet.id,
    name: 'Ethereum',
    icon: '⟠',
    color: 'bg-blue-500',
    rpcUrl: mainnet.rpcUrls.default.http[0],
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },

  // Arbitrum One
  [arbitrum.id]: {
    id: arbitrum.id,
    name: 'Arbitrum',
    icon: '🔵',
    color: 'bg-blue-600',
    rpcUrl: arbitrum.rpcUrls.default.http[0],
    blockExplorer: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },

  // Optimism
  [optimism.id]: {
    id: optimism.id,
    name: 'Optimism',
    icon: '🔴',
    color: 'bg-red-500',
    rpcUrl: optimism.rpcUrls.default.http[0],
    blockExplorer: 'https://optimistic.etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },

  // Polygon
  [polygon.id]: {
    id: polygon.id,
    name: 'Polygon',
    icon: '🟣',
    color: 'bg-purple-500',
    rpcUrl: polygon.rpcUrls.default.http[0],
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },

  // Base
  [base.id]: {
    id: base.id,
    name: 'Base',
    icon: '🔵',
    color: 'bg-blue-400',
    rpcUrl: base.rpcUrls.default.http[0],
    blockExplorer: 'https://basescan.org',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};

/**
 * Get chain metadata by chain ID
 */
export function getChainMetadata(chainId: number): ChainMetadata | undefined {
  return chainMetadata[chainId];
}

/**
 * Get chain name by ID
 */
export function getChainName(chainId: number): string {
  return chainMetadata[chainId]?.name || 'Unknown Network';
}

/**
 * Get native currency symbol for a chain
 */
export function getNativeCurrency(chainId: number): string {
  return chainMetadata[chainId]?.nativeCurrency.symbol || 'ETH';
}

/**
 * Check if a chain is supported
 */
export function isSupportedChain(chainId: number): boolean {
  return chainId in chainMetadata;
}

/**
 * List of all supported chain IDs
 */
export const supportedChainIds = Object.keys(chainMetadata).map(Number);

/**
 * Default chain (RiseChain Testnet)
 */
export const DEFAULT_CHAIN_ID = riseChain.id;

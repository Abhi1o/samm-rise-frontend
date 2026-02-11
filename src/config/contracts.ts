import { Address } from 'viem';
import { riseChain } from './chains';

/**
 * Contract addresses by chain ID
 * These addresses are deployed on RiseChain Testnet
 * Updated: 2026-02-10
 */
export const CONTRACT_ADDRESSES = {
  [riseChain.id]: {
    crossPoolRouter: '0x622c2D2719197A047f29BCBaaaEBBDbD54b45a11' as Address,
    factory: '0x1114cF606d700bB8490C9D399500e35a31FaE27A' as Address,
    tokenFaucet: '0x983A8fe1408bBba8a1EF02641E5ECD05b9a4BA1c' as Address, // Keeping old faucet address
  },
} as const;

/**
 * Get CrossPoolRouter address for a given chain
 */
export function getCrossPoolRouter(chainId: number): Address {
  const address = CONTRACT_ADDRESSES[chainId]?.crossPoolRouter;
  if (!address) {
    throw new Error(`CrossPoolRouter not deployed on chain ${chainId}`);
  }
  return address;
}

/**
 * Get SAMMPoolFactory address for a given chain
 */
export function getFactory(chainId: number): Address {
  const address = CONTRACT_ADDRESSES[chainId]?.factory;
  if (!address) {
    throw new Error(`SAMMPoolFactory not deployed on chain ${chainId}`);
  }
  return address;
}

/**
 * Get TokenFaucet address for a given chain
 */
export function getTokenFaucet(chainId: number): Address {
  const address = CONTRACT_ADDRESSES[chainId]?.tokenFaucet;
  if (!address) {
    throw new Error(`TokenFaucet not deployed on chain ${chainId}`);
  }
  return address;
}

/**
 * Check if contracts are deployed on a chain
 */
export function hasContracts(chainId: number): boolean {
  return chainId in CONTRACT_ADDRESSES;
}

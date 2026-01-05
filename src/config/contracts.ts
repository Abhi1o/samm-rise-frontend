import { Address } from 'viem';
import { riseChain } from './chains';

/**
 * Contract addresses by chain ID
 * These addresses are deployed on RiseChain Testnet
 */
export const CONTRACT_ADDRESSES = {
  [riseChain.id]: {
    crossPoolRouter: '0x8a4ED210afE6Ed5B374CFEcBA2A5aD283FAB2fDa' as Address,
    factory: '0xA74a8271C02237083c53eEE4153C07252F3925a3' as Address,
    tokenFaucet: '0x983A8fe1408bBba8a1EF02641E5ECD05b9a4BA1c' as Address,
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

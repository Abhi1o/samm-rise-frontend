import { Address } from 'viem';
import { riseChain } from './chains';

/**
 * Contract addresses by chain ID
 * These addresses are deployed on RiseChain Testnet
 * Updated: 2026-03-29
 */
export const CONTRACT_ADDRESSES = {
  [riseChain.id]: {
    crossPoolRouter: '0x6A45347a8DbC629000F725c544D695209b0c3d00' as Address,
    factory: '0xc4c6ceABeBBfA1Bf9D219fE80F5b95982664fb94' as Address,
    orchestrator: '0x93174f86F57A97827680c279e07704AbE2a0b0c0' as Address,
    tokenFaucet: '0x42a930BF9259cE3D9e76bb1d8C61b52daf68dBE4' as Address, // Updated Mar 29, 2026
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
 * Get Orchestrator address for a given chain
 */
export function getOrchestrator(chainId: number): Address {
  const address = CONTRACT_ADDRESSES[chainId]?.orchestrator;
  if (!address) {
    throw new Error(`Orchestrator not deployed on chain ${chainId}`);
  }
  return address;
}

/**
 * Check if contracts are deployed on a chain
 */
export function hasContracts(chainId: number): boolean {
  return chainId in CONTRACT_ADDRESSES;
}

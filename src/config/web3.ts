import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'viem';
import { mainnet, arbitrum, optimism, polygon, base } from 'wagmi/chains';
import { riseChain } from './chains';

/**
 * Get RPC URL for a chain with Alchemy if available, fallback to public RPC
 */
function getRpcUrl(chain: typeof mainnet | typeof riseChain): string {
  const alchemyKey = import.meta.env.VITE_ALCHEMY_API_KEY;

  // Alchemy URLs for supported chains
  const alchemyUrls: Record<number, string> = {
    [mainnet.id]: `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`,
    [polygon.id]: `https://polygon-mainnet.g.alchemy.com/v2/${alchemyKey}`,
    [arbitrum.id]: `https://arb-mainnet.g.alchemy.com/v2/${alchemyKey}`,
    [optimism.id]: `https://opt-mainnet.g.alchemy.com/v2/${alchemyKey}`,
    [base.id]: `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`,
  };

  // Use Alchemy if key is available, otherwise use default public RPC
  if (alchemyKey && alchemyKey !== 'your_alchemy_api_key_here') {
    return alchemyUrls[chain.id] || chain.rpcUrls.default.http[0];
  }

  return chain.rpcUrls.default.http[0];
}

/**
 * Supported chains for the app
 */
export const chains = [riseChain, mainnet, arbitrum, optimism, polygon, base] as const;

/**
 * Wagmi configuration with RainbowKit
 */
export const wagmiConfig = getDefaultConfig({
  appName: 'SAMM DEX',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: chains,
  transports: {
    [riseChain.id]: http(getRpcUrl(riseChain)),
    [mainnet.id]: http(getRpcUrl(mainnet)),
    [arbitrum.id]: http(getRpcUrl(arbitrum)),
    [optimism.id]: http(getRpcUrl(optimism)),
    [polygon.id]: http(getRpcUrl(polygon)),
    [base.id]: http(getRpcUrl(base)),
  },
  ssr: false,
});

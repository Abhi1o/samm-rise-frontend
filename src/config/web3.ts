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
 * Get WalletConnect Project ID
 * Validates and returns the project ID from environment variables
 */
function getProjectId(): string {
  const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

  // Validate project ID
  if (!projectId || projectId === 'your_walletconnect_project_id_here') {
    throw new Error(
      '❌ VITE_WALLETCONNECT_PROJECT_ID is not configured!\n\n' +
      'Get your FREE Project ID:\n' +
      '1. Go to https://cloud.walletconnect.com/sign-in\n' +
      '2. Create a new project\n' +
      '3. Copy the Project ID\n' +
      '4. Add to .env.local: VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here\n' +
      '5. Restart the dev server'
    );
  }

  if (projectId.length !== 32) {
    throw new Error(
      `❌ Invalid WalletConnect Project ID!\n` +
      `Expected 32 characters, got ${projectId.length}.\n` +
      `Please check your .env.local file.`
    );
  }

  return projectId;
}

/**
 * Wagmi configuration with RainbowKit
 * Uses getDefaultConfig which automatically includes MetaMask and other popular wallets
 */
export const wagmiConfig = getDefaultConfig({
  appName: 'SAMM DEX',
  projectId: getProjectId(),
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
  // Enable wallet detection
  multiInjectedProviderDiscovery: true,
});

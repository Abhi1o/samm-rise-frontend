import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useChainId, useSwitchChain } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { riseChain } from '@/config/chains';
import { sepolia } from 'wagmi/chains';

export type SwapRoute = 'samm' | 'uniswap';

interface ChainInfo {
  chainId: number;
  name: string;
  displayName: string;
}

interface NetworkContextType {
  selectedNetwork: ChainInfo | null;
  availableNetworks: ChainInfo[];
  isLoading: boolean;
  error: string | null;
  switchNetwork: (chainId: number) => Promise<void>;
  refetchNetworks: () => Promise<void>;
  selectedRoute: SwapRoute;
  setSelectedRoute: (route: SwapRoute) => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

const NETWORK_STORAGE_KEY = 'samm_selected_network';

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<ChainInfo | null>(null);
  const [availableNetworks, setAvailableNetworks] = useState<ChainInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<SwapRoute>('samm');
  
  const walletChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { toast } = useToast();

  // Static network list — RiseChain is the primary DEX; Sepolia is used for the Uniswap route
  const AVAILABLE_NETWORKS: ChainInfo[] = [
    { chainId: riseChain.id, name: 'risechain', displayName: 'RiseChain Testnet' },
    { chainId: sepolia.id,   name: 'sepolia',   displayName: 'Sepolia Testnet' },
  ];

  const fetchNetworks = () => {
    setAvailableNetworks(AVAILABLE_NETWORKS);
    setIsLoading(false);
    return AVAILABLE_NETWORKS;
  };

  // Initialize: set networks and restore selected network from localStorage
  useEffect(() => {
    const networks = fetchNetworks();

    const savedChainId = localStorage.getItem(NETWORK_STORAGE_KEY);
    if (savedChainId) {
      const saved = networks.find(n => n.chainId === parseInt(savedChainId));
      if (saved) {
        setSelectedNetwork(saved);
        return;
      }
    }

    // Default to RiseChain
    setSelectedNetwork(networks[0]);
    localStorage.setItem(NETWORK_STORAGE_KEY, networks[0].chainId.toString());
  }, []);

  // Sync with wallet chain changes
  useEffect(() => {
    if (!walletChainId || !availableNetworks.length) return;

    const walletNetwork = availableNetworks.find(n => n.chainId === walletChainId);
    if (walletNetwork && walletNetwork.chainId !== selectedNetwork?.chainId) {
      console.log('Wallet switched to:', walletNetwork.displayName);
      setSelectedNetwork(walletNetwork);
      localStorage.setItem(NETWORK_STORAGE_KEY, walletNetwork.chainId.toString());
    }
  }, [walletChainId, availableNetworks, selectedNetwork]);

  // Switch network function
  const switchNetwork = async (chainId: number) => {
    const targetNetwork = availableNetworks.find(n => n.chainId === chainId);
    if (!targetNetwork) {
      toast({
        title: 'Network Not Available',
        description: 'The selected network is not supported',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Update context immediately for browsing
      setSelectedNetwork(targetNetwork);
      localStorage.setItem(NETWORK_STORAGE_KEY, chainId.toString());

      // If wallet is connected, request switch
      if (switchChain && walletChainId !== chainId) {
        try {
          await switchChain({ chainId });
          toast({
            title: 'Network Switched',
            description: `Switched to ${targetNetwork.displayName}`,
          });
        } catch (err: any) {
          // User rejected or wallet doesn't support the network
          console.warn('Wallet network switch failed:', err);
          
          // Keep the context updated even if wallet switch fails
          // This allows browsing without wallet connection
          toast({
            title: 'Wallet Not Switched',
            description: 'Network changed for browsing. Connect wallet to perform transactions.',
          });
        }
      } else {
        toast({
          title: 'Network Changed',
          description: `Viewing ${targetNetwork.displayName}`,
        });
      }
    } catch (err: any) {
      console.error('Failed to switch network:', err);
      toast({
        title: 'Network Switch Failed',
        description: err.message || 'Failed to switch network',
        variant: 'destructive',
      });
    }
  };

  const refetchNetworks = async () => {
    fetchNetworks();
  };

  return (
    <NetworkContext.Provider
      value={{
        selectedNetwork,
        availableNetworks,
        isLoading,
        error,
        switchNetwork,
        refetchNetworks,
        selectedRoute,
        setSelectedRoute,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}

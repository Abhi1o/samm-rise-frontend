import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useChainId, useSwitchChain } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { riseChain } from '@/config/chains';

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
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

const NETWORK_STORAGE_KEY = 'samm_selected_network';
const NETWORKS_CACHE_KEY = 'samm_available_networks';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<ChainInfo | null>(null);
  const [availableNetworks, setAvailableNetworks] = useState<ChainInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const walletChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { toast } = useToast();

  // Fetch available networks from backend
  const fetchNetworks = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check cache first
      const cached = localStorage.getItem(NETWORKS_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setAvailableNetworks(data);
          setIsLoading(false);
          return data;
        }
      }

      // SAMM is single-chain (RiseChain only)
      // No need to fetch from backend
      const networks: ChainInfo[] = [
        {
          chainId: riseChain.id,
          name: 'risechain',
          displayName: 'RiseChain Testnet',
        },
      ];

      // Cache the result
      localStorage.setItem(
        NETWORKS_CACHE_KEY,
        JSON.stringify({ data: networks, timestamp: Date.now() })
      );

      setAvailableNetworks(networks);
      setIsLoading(false);
      return networks;
    } catch (err: any) {
      console.error('Failed to fetch networks:', err);
      setError(err.message || 'Failed to fetch networks');
      
      // Fallback to RiseChain only
      const fallbackNetwork: ChainInfo = {
        chainId: riseChain.id,
        name: 'risechain',
        displayName: 'RiseChain Testnet',
      };
      
      setAvailableNetworks([fallbackNetwork]);
      setIsLoading(false);
      return [fallbackNetwork];
    }
  };

  // Initialize: fetch networks and restore selected network
  useEffect(() => {
    const initialize = async () => {
      const networks = await fetchNetworks();
      
      // Try to restore from localStorage
      const savedChainId = localStorage.getItem(NETWORK_STORAGE_KEY);
      if (savedChainId) {
        const saved = networks.find(n => n.chainId === parseInt(savedChainId));
        if (saved) {
          setSelectedNetwork(saved);
          return;
        }
      }

      // Default to first network (RiseChain)
      if (networks.length > 0) {
        setSelectedNetwork(networks[0]);
        localStorage.setItem(NETWORK_STORAGE_KEY, networks[0].chainId.toString());
      }
    };

    initialize();
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
    // Clear cache
    localStorage.removeItem(NETWORKS_CACHE_KEY);
    await fetchNetworks();
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

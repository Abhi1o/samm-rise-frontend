import { Wallet, Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import ThemeToggle from "./ThemeToggle";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { mainnet, arbitrum, optimism, polygon, base } from 'wagmi/chains';
import { formatAddress } from "@/utils/formatters";
import { chainMetadata } from "@/config/chains";

const NETWORKS = [
  { name: "Ethereum", icon: "⟠", color: "bg-blue-500", chainId: mainnet.id },
  { name: "Arbitrum", icon: "🔵", color: "bg-blue-600", chainId: arbitrum.id },
  { name: "Optimism", icon: "🔴", color: "bg-red-500", chainId: optimism.id },
  { name: "Polygon", icon: "🟣", color: "bg-purple-500", chainId: polygon.id },
  { name: "Base", icon: "🔵", color: "bg-blue-400", chainId: base.id },
];

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Get current network from chainId
  const selectedNetwork = NETWORKS.find(n => n.chainId === chainId) || NETWORKS[0];

  // Handle network switching
  const handleNetworkSwitch = (network: typeof NETWORKS[0]) => {
    if (isConnected && switchChain) {
      switchChain({ chainId: network.chainId });
    }
    setNetworkDropdownOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="glass-card border-b border-glass-border !overflow-visible">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-light flex items-center justify-center orange-glow-subtle">
                <span className="font-bold text-primary-foreground text-lg">Ω</span>
              </div>
              <span className="font-bold text-xl tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-light">SAMM</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="/#swap" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Swap
              </a>
              <a href="/#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                How it Works
              </a>
              <Link to="/pools" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Pools
              </Link>
              <a href="https://samm-2.gitbook.io/samm-docs/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Docs
              </a>
            </nav>

            {/* Theme Toggle + Network Selector + Connect Wallet */}
            <div className="hidden md:flex items-center gap-3">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Network Selector */}
              <div className="relative">
                <button
                  onClick={() => setNetworkDropdownOpen(!networkDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
                >
                  <div className={`w-5 h-5 rounded-full ${selectedNetwork.color} flex items-center justify-center text-xs`}>
                    {selectedNetwork.icon}
                  </div>
                  <span className="text-sm font-medium">{selectedNetwork.name}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
                {networkDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-[998]" 
                      onClick={() => setNetworkDropdownOpen(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-[999] overflow-hidden">
                      {NETWORKS.map((network) => (
                        <button
                          key={network.name}
                          onClick={() => handleNetworkSwitch(network)}
                          className="w-full px-4 py-2.5 text-left hover:bg-secondary/50 transition-colors flex items-center gap-2"
                        >
                          <div className={`w-5 h-5 rounded-full ${network.color} flex items-center justify-center text-xs`}>
                            {network.icon}
                          </div>
                          <span>{network.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  mounted,
                }) => {
                  const ready = mounted;
                  const connected = ready && account && chain;

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        style: {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <Button variant="wallet" size="lg" onClick={openConnectModal}>
                              <Wallet className="w-4 h-4 mr-2" />
                              Connect Wallet
                            </Button>
                          );
                        }

                        return (
                          <Button variant="wallet" size="lg" onClick={openAccountModal}>
                            <Wallet className="w-4 h-4 mr-2" />
                            {formatAddress(account.address)}
                          </Button>
                        );
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden text-foreground p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-glass-border pt-4 animate-fade-in">
              <nav className="flex flex-col gap-4">
                <a href="/#swap" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                  Swap
                </a>
                <a href="/#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                  How it Works
                </a>
                <Link to="/pools" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                  Pools
                </Link>
                <a href="https://samm-2.gitbook.io/samm-docs/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                  Docs
                </a>
                <div className="flex items-center gap-2 mt-2">
                  <ThemeToggle />
                  <select
                    value={selectedNetwork.name}
                    onChange={(e) => {
                      const network = NETWORKS.find(n => n.name === e.target.value);
                      if (network) handleNetworkSwitch(network);
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-secondary/50 border border-border text-sm"
                  >
                    {NETWORKS.map((network) => (
                      <option key={network.name} value={network.name}>{network.name}</option>
                    ))}
                  </select>
                </div>
                <ConnectButton.Custom>
                  {({
                    account,
                    chain,
                    openAccountModal,
                    openConnectModal,
                    mounted,
                  }) => {
                    const ready = mounted;
                    const connected = ready && account && chain;

                    return (
                      <Button
                        variant="wallet"
                        className="mt-2"
                        onClick={connected ? openAccountModal : openConnectModal}
                      >
                        <Wallet className="w-4 h-4 mr-2" />
                        {connected ? formatAddress(account.address) : 'Connect Wallet'}
                      </Button>
                    );
                  }}
                </ConnectButton.Custom>
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

import { Wallet, Menu, X, ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import ThemeToggle from "./ThemeToggle";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useEnsName, useChainId } from "wagmi";
import { formatAddress } from "@/utils/formatters";
import { useNetwork } from "@/contexts/NetworkContext";
import { chainMetadata } from "@/config/chains";
import FaucetButton from "./FaucetButton";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);
  const { selectedNetwork, availableNetworks, isLoading, switchNetwork, selectedRoute } = useNetwork();
  const { address: connectedAddress } = useAccount();
  const { data: ensName } = useEnsName({ address: connectedAddress, chainId: 1 });
  const walletChainId = useChainId();

  // When Uniswap route is selected, show Sepolia in the header regardless of wallet chain.
  // The wallet only switches to Sepolia when the swap fires, but the user picked Sepolia route.
  const activeChainId = selectedRoute === 'uniswap' ? 11155111 : (walletChainId || selectedNetwork?.chainId);
  const currentNetworkMeta = activeChainId ? chainMetadata[activeChainId] : null;
  const networkIcon = currentNetworkMeta?.icon || "🚀";
  const networkColor = currentNetworkMeta?.color || "bg-orange-500";
  const networkName = selectedRoute === 'uniswap' ? 'Sepolia' : (currentNetworkMeta?.name || selectedNetwork?.displayName || "Loading...");

  // Handle network switching
  const handleNetworkSwitch = async (chainId: number) => {
    await switchNetwork(chainId);
    setNetworkDropdownOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="glass-card border-b border-glass-border !overflow-visible">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl  flex items-center justify-center orange-glow-subtle">
                <img className="w-8 h-8 text-white" src="/assets/image/saam_logo.png" alt="SAMM Logo" />
              </div>
              <span className="font-bold text-xl tracking-tight">
                <span className="font-bold text-xl tracking-tight">SAMM </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-light">DEX</span>
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
              <Link to="/portfolio" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Portfolio
              </Link>
              <Link to="/history" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                History
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
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    networkIcon.startsWith('data:') || networkIcon.startsWith('/') || networkIcon.startsWith('http') ? (
                      <img src={networkIcon} alt={networkName} className="w-4 h-4 object-cover rounded-full" />
                    ) : (
                      <div className={`w-5 h-5 rounded-full ${networkColor} flex items-center justify-center text-xs`}>
                        {networkIcon}
                      </div>
                    )
                  )}
                  <span className="text-sm font-medium">{networkName}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
                {networkDropdownOpen && !isLoading && (
                  <>
                    <div 
                      className="fixed inset-0 z-[998]" 
                      onClick={() => setNetworkDropdownOpen(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-[999] overflow-hidden">
                      {availableNetworks.map((network) => {
                        const meta = chainMetadata[network.chainId];
                        const isSelected = network.chainId === selectedNetwork?.chainId;
                        return (
                          <button
                            key={network.chainId}
                            onClick={() => handleNetworkSwitch(network.chainId)}
                            className={`w-full px-4 py-3 text-left hover:bg-secondary/50 transition-colors flex items-center gap-3 ${
                              isSelected ? 'bg-secondary/30' : ''
                            }`}
                          >
                            {meta?.icon?.startsWith('data:') || meta?.icon?.startsWith('/') || meta?.icon?.startsWith('http') ? (
                              <img src={meta.icon} alt={network.displayName} className="w-6 h-6 object-cover rounded-full" />
                            ) : (
                              <div className={`w-6 h-6 rounded-full ${meta?.color || 'bg-gray-500'} flex items-center justify-center text-sm`}>
                                {meta?.icon || '🌐'}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="font-medium">{network.displayName}</div>
                            </div>
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Faucet Button (only on RiseChain Testnet) */}
              <FaucetButton />

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
                            {ensName ?? formatAddress(account.address)}
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
                <Link to="/portfolio" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                  Portfolio
                </Link>
                <Link to="/history" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                  History
                </Link>
                <a href="https://samm-2.gitbook.io/samm-docs/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                  Docs
                </a>
                <div className="flex items-center gap-2 mt-2">
                  <ThemeToggle />
                  <select
                    value={selectedNetwork?.chainId || ''}
                    onChange={(e) => {
                      const chainId = parseInt(e.target.value);
                      if (chainId) handleNetworkSwitch(chainId);
                    }}
                    disabled={isLoading}
                    className="flex-1 px-3 py-2 rounded-xl bg-secondary/50 border border-border text-sm disabled:opacity-50"
                  >
                    {availableNetworks.map((network) => (
                      <option key={network.chainId} value={network.chainId}>
                        {network.displayName}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Faucet Button (Mobile - only on RiseChain Testnet) */}
                <FaucetButton />

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
                        {connected ? (ensName ?? formatAddress(account.address)) : 'Connect Wallet'}
                      </Button>
                    );
                  }}
                </ConnectButton.Custom>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Token Faucet Modal */}
      {/* TODO: Re-enable when faucet contract is configured */}
      {/* <TokenFaucetModal isOpen={faucetOpen} onClose={() => setFaucetOpen(false)} /> */}
    </header>
  );
};

export default Header;

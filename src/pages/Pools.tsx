import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Search, Plus, ChevronDown, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import AddLiquidityModal from "@/components/AddLiquidityModal";
import RemoveLiquidityModal from "@/components/RemoveLiquidityModal";
import CreatePoolModal from "@/components/CreatePoolModal";
import { usePoolData } from "@/hooks/usePoolData";
import { useUserPositions, UserPosition } from "@/hooks/useUserPositions";
import { useNetwork } from "@/contexts/NetworkContext";
import { useAccount } from "wagmi";
import TokenLogo from "@/components/TokenLogo";
import { getTokensForChain } from "@/config/tokens";
import { formatUnits } from "viem";

const TOKEN_ICONS: Record<string, string> = {
  ETH: "⟠",
  USDC: "💲",
  USDT: "💵",
  WBTC: "₿",
  DAI: "◈",
  ARB: "🔵",
  OP: "🔴",
  MATIC: "🟣",
  LINK: "⬡",
};

const Pools = () => {
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  const [positionStatus, setPositionStatus] = useState<"all" | "active" | "inactive" | "closed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("All Networks");
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);
  const [addLiquidityOpen, setAddLiquidityOpen] = useState(false);
  const [removeLiquidityOpen, setRemoveLiquidityOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<UserPosition | null>(null);
  const [createPoolOpen, setCreatePoolOpen] = useState(false);

  // Get current network from context
  const { selectedNetwork: currentNetwork } = useNetwork();
  const { address: userAddress } = useAccount();

  // Fetch real pool data from backend for current network
  const { pools, totalShards, chainName, isLoading, error, refetch } = usePoolData();

  // Fetch user positions
  const { positions: userPositions, isLoading: positionsLoading, hasPositions, refetch: refetchPositions } = useUserPositions();

  // Get tokens for current network to fetch logoURIs
  const networkTokens = currentNetwork ? getTokensForChain(currentNetwork.chainId) : [];

  // Helper to get token logo URI
  const getTokenLogoURI = (symbol: string) => {
    const token = networkTokens.find(t => t.symbol === symbol);
    return token?.logoURI;
  };

  // Helper to get token icon
  const getTokenIcon = (symbol: string) => {
    const token = networkTokens.find(t => t.symbol === symbol);
    return token?.icon || TOKEN_ICONS[symbol] || "🪙";
  };

  // Refetch pools when network changes
  useEffect(() => {
    if (currentNetwork) {
      refetch();
    }
  }, [currentNetwork, refetch]);

  // Transform pools to display format
  const displayPools = pools.map((pool, index) => {
    const [token0Symbol, token1Symbol] = pool.pairName.split('-');
    const tvl = pool.liquidity ? `$${Number(pool.liquidity).toLocaleString()}` : '$0';

    return {
      id: index + 1,
      token0: token0Symbol,
      token1: token1Symbol,
      token0LogoURI: getTokenLogoURI(token0Symbol),
      token1LogoURI: getTokenLogoURI(token1Symbol),
      token0Icon: getTokenIcon(token0Symbol),
      token1Icon: getTokenIcon(token1Symbol),
      network: currentNetwork?.displayName || chainName,
      feeTier: '0.25%', // SAMM default fee tier
      apr: '0%', // TODO: Calculate from stats
      tvl,
      volume24h: '$0', // TODO: Get from stats endpoint
      type: 'SAMM',
      address: pool.address,
    };
  });

  const filteredPools = displayPools.filter((pool) => {
    const matchesSearch =
      pool.token0.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pool.token1.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNetwork =
      selectedNetwork === "All Networks" || pool.network === selectedNetwork;
    return matchesSearch && matchesNetwork;
  });

  return (
    <>
      <Helmet>
        <title>Liquidity Pools - SAMM</title>
        <meta
          name="description"
          content="Add liquidity to SAMM pools and earn trading fees. Explore high-yield liquidity pools on Ethereum, Arbitrum, Optimism, and more."
        />
      </Helmet>

      <div className="relative min-h-screen">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            {/* Hero Section */}
            <div className="mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-light to-primary">
                  Earn from LP
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                Liquidity Pools & Farms
              </p>
              <div className="flex gap-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <a href="#" className="text-primary hover:underline font-medium">Learn How</a>
                <span className="text-border">|</span>
                <a href="#" className="text-primary hover:underline font-medium">Legacy Farm Page</a>
              </div>
            </div>

            {/* Tabs and Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                    activeTab === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  All Pools
                </button>
                <button
                  onClick={() => setActiveTab("my")}
                  className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                    activeTab === "my"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  My Positions
                </button>
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search pools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-secondary/50 border-border rounded-xl"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="lg"className="rounded-xl" onClick={() => setCreatePoolOpen(true)}>
                  Create Pool
                </Button>
                <Button variant="swap" size="lg" className="rounded-xl" onClick={() => setAddLiquidityOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Liquidity
                </Button>
              </div>
            </div>

            

            {/* Pools Table */}
            <div className="glass-card rounded-2xl border border-glass-border overflow-hidden ">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border text-sm text-muted-foreground font-medium">
                <div className="col-span-3">ALL POOLS</div>
                <div className="col-span-1">FEE TIER</div>
                <div className="col-span-2">APR ↓</div>
                <div className="col-span-2">TVL ↓</div>
                <div className="col-span-2">VOLUME 24H ↓</div>
                <div className="col-span-1">TYPE</div>
                <div className="col-span-1"></div>
              </div>

              {/* Table Body */}
              {activeTab === "all" ? (
                <>
                  {/* Loading State */}
                  {isLoading && (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <span className="ml-2 text-muted-foreground">Loading pools...</span>
                    </div>
                  )}

                  {/* Error State */}
                  {error && !isLoading && (
                    <div className="p-6">
                      <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-destructive mb-2">Failed to load pools. Please try again.</p>
                        <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-2">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retry
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {!isLoading && !error && filteredPools.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <p className="text-lg">No pools available</p>
                      <p className="text-sm">Check back later or create a new pool</p>
                    </div>
                  )}

                  {/* Pools List */}
                  {!isLoading && !error && filteredPools.map((pool, index) => (
                  <div
                    key={pool.id}
                    className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border/50 hover:bg-secondary/20 transition-colors items-center animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <TokenLogo
                          symbol={pool.token0}
                          logoURI={pool.token0LogoURI}
                          icon={pool.token0Icon}
                          size="md"
                          className="border-2 border-background"
                        />
                        <TokenLogo
                          symbol={pool.token1}
                          logoURI={pool.token1LogoURI}
                          icon={pool.token1Icon}
                          size="md"
                          className="border-2 border-background"
                        />
                      </div>
                      <div>
                        <p className="font-semibold">{pool.token0} / {pool.token1}</p>
                        <p className="text-xs text-muted-foreground">{pool.network}</p>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <span className="px-2 py-1 rounded bg-secondary/50 text-xs">{pool.type} | {pool.feeTier}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-primary font-semibold">🔥 {pool.apr}</span>
                    </div>
                    <div className="col-span-2">{pool.tvl}</div>
                    <div className="col-span-2">{pool.volume24h}</div>
                    <div className="col-span-1">
                      <span className="px-2 py-1 rounded bg-secondary/30 text-xs">{pool.type}</span>
                    </div>
                    <div className="col-span-1">
                      <button className="p-2 hover:bg-secondary/50 rounded-lg transition-colors">
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  ))}
                </>
              ) : (
                <div>
                  {/* Position Status Tabs with Refresh Button */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-6">
                      {(["all", "active", "inactive", "closed"] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => setPositionStatus(status)}
                          className={`text-sm font-medium transition-colors capitalize ${
                            positionStatus === status
                              ? "text-primary"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetchPositions()}
                      disabled={positionsLoading}
                      className="rounded-lg"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${positionsLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                  
                  {/* Loading State */}
                  {positionsLoading && (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <span className="ml-2 text-muted-foreground">Loading positions...</span>
                    </div>
                  )}

                  {/* Not Connected State */}
                  {!userAddress && !positionsLoading && (
                    <div className="px-6 py-16 text-center">
                      <p className="text-muted-foreground mb-4">Wallet not connected</p>
                      <p className="text-sm text-muted-foreground mb-6">Connect your wallet to view your liquidity positions</p>
                    </div>
                  )}

                  {/* Empty State - No Positions */}
                  {userAddress && !positionsLoading && !hasPositions && (
                    <div className="px-6 py-16 text-center">
                      <p className="text-muted-foreground mb-4">No positions found</p>
                      <p className="text-sm text-muted-foreground mb-6">Add liquidity to a pool to start earning fees</p>
                      <Button variant="swap" onClick={() => setAddLiquidityOpen(true)}>Add Liquidity</Button>
                    </div>
                  )}

                  {/* User Positions List */}
                  {userAddress && !positionsLoading && hasPositions && (
                    <div>
                      <div className="px-6 py-3 bg-secondary/20 text-sm text-muted-foreground">
                        Showing {userPositions.length} position{userPositions.length !== 1 ? 's' : ''}
                      </div>
                      {userPositions.map((position, index) => {
                        const token0 = networkTokens.find(t => t.symbol === position.token0Symbol);
                        const token1 = networkTokens.find(t => t.symbol === position.token1Symbol);

                        // Format token amounts
                        const token0AmountFormatted = token0 
                          ? parseFloat(formatUnits(BigInt(position.token0Amount), token0.decimals)).toFixed(4)
                          : '0';
                        const token1AmountFormatted = token1
                          ? parseFloat(formatUnits(BigInt(position.token1Amount), token1.decimals)).toFixed(4)
                          : '0';

                        return (
                          <div
                            key={position.poolAddress}
                            className="px-6 py-6 border-b border-border/50 hover:bg-secondary/20 transition-colors animate-fade-in"
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="flex -space-x-2">
                                  <TokenLogo
                                    symbol={position.token0Symbol}
                                    logoURI={token0?.logoURI}
                                    icon={token0?.icon || getTokenIcon(position.token0Symbol)}
                                    size="md"
                                    className="border-2 border-background"
                                  />
                                  <TokenLogo
                                    symbol={position.token1Symbol}
                                    logoURI={token1?.logoURI}
                                    icon={token1?.icon || getTokenIcon(position.token1Symbol)}
                                    size="md"
                                    className="border-2 border-background"
                                  />
                                </div>
                                <div>
                                  <p className="font-semibold text-lg">{position.pairName}</p>
                                  <p className="text-xs text-muted-foreground">{position.poolName}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="rounded-lg"
                                  onClick={() => {
                                    setSelectedPosition(position);
                                    setRemoveLiquidityOpen(true);
                                  }}
                                >
                                  Remove
                                </Button>
                                <Button variant="swap" size="sm" className="rounded-lg" onClick={() => setAddLiquidityOpen(true)}>
                                  Add More
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground mb-1">LP Tokens</p>
                                <p className="font-semibold">{position.lpBalanceFormatted}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Share of Pool</p>
                                <p className="font-semibold text-primary">{position.shareOfPool.toFixed(4)}%</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">{position.token0Symbol} Amount</p>
                                <p className="font-semibold">{token0AmountFormatted}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">{position.token1Symbol} Amount</p>
                                <p className="font-semibold">{token1AmountFormatted}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />

        <AddLiquidityModal isOpen={addLiquidityOpen} onClose={() => setAddLiquidityOpen(false)} />
        <RemoveLiquidityModal 
          isOpen={removeLiquidityOpen} 
          onClose={() => {
            setRemoveLiquidityOpen(false);
            setSelectedPosition(null);
            refetchPositions();
          }} 
          position={selectedPosition}
        />
        <CreatePoolModal isOpen={createPoolOpen} onClose={() => setCreatePoolOpen(false)} />
      </div>
    </>
  );
};

export default Pools;

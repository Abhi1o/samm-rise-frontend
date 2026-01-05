import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Search, Plus, ChevronDown, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import AddLiquidityModal from "@/components/AddLiquidityModal";
import CreatePoolModal from "@/components/CreatePoolModal";
import { usePoolData } from "@/hooks/usePoolData";
import { getChainName } from "@/config/chains";

const POOLS_DATA = [
  { id: 1, token0: "ETH", token1: "USDC", network: "Ethereum", feeTier: "0.05%", apr: "42.87%", tvl: "$2,326,158", volume24h: "$68,924,061", type: "V3" },
  { id: 2, token0: "ETH", token1: "USDT", network: "Ethereum", feeTier: "0.05%", apr: "38.72%", tvl: "$1,486,523", volume24h: "$9,493,016", type: "V3" },
  { id: 3, token0: "WBTC", token1: "ETH", network: "Ethereum", feeTier: "0.3%", apr: "25.90%", tvl: "$696,436", volume24h: "$13,169,199", type: "V3" },
  { id: 4, token0: "DAI", token1: "USDC", network: "Ethereum", feeTier: "0.01%", apr: "3.25%", tvl: "$386,937", volume24h: "$164,885", type: "Stable" },
  { id: 5, token0: "ARB", token1: "ETH", network: "Arbitrum", feeTier: "0.3%", apr: "54.11%", tvl: "$213,158", volume24h: "$1,032,048", type: "V3" },
  { id: 6, token0: "OP", token1: "ETH", network: "Optimism", feeTier: "0.3%", apr: "85.43%", tvl: "$195,456", volume24h: "$1,015,301", type: "V3" },
  { id: 7, token0: "MATIC", token1: "USDC", network: "Polygon", feeTier: "0.3%", apr: "130.77%", tvl: "$163,081", volume24h: "$1,392,574", type: "V3" },
  { id: 8, token0: "LINK", token1: "ETH", network: "Ethereum", feeTier: "0.3%", apr: "18.45%", tvl: "$142,892", volume24h: "$892,341", type: "V3" },
];

const NETWORKS = ["All Networks", "Ethereum", "Arbitrum", "Optimism", "Polygon", "Base"];

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
  const [createPoolOpen, setCreatePoolOpen] = useState(false);

  // Fetch real pool data from backend
  const { pools, totalShards, chainName, isLoading, error, refetch } = usePoolData();

  // Transform pools to display format
  const displayPools = pools.map((pool, index) => {
    const [token0Symbol, token1Symbol] = pool.pairName.split('-');
    const tvl = pool.liquidity ? `$${Number(pool.liquidity).toLocaleString()}` : '$0';

    return {
      id: index + 1,
      token0: token0Symbol,
      token1: token1Symbol,
      network: getChainName(pool.chainId || 11155931),
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

            {/* Featured Pool Card */}
            <div className="glass-card p-6 rounded-2xl border border-glass-border mb-8 max-w-md animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">TOP POOL 🔥</span>
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-lg border-2 border-background">⟠</div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-lg border-2 border-background">💲</div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-primary mb-4">ETH / USDC</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">FEE TIER</p>
                  <p className="font-semibold">0.05%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">APR</p>
                  <p className="font-semibold text-primary">42.87%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">TVL</p>
                  <p className="font-semibold">$2.3M</p>
                </div>
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
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="rounded-xl" onClick={() => setCreatePoolOpen(true)}>
                  Create Pool
                </Button>
                <Button variant="swap" size="lg" className="rounded-xl" onClick={() => setAddLiquidityOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Liquidity
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="glass-card p-4 rounded-2xl border border-glass-border mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Network Selector */}
                <div className="relative">
                  <button
                    onClick={() => setNetworkDropdownOpen(!networkDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 transition-colors min-w-[180px]"
                  >
                    <div className="flex -space-x-1">
                      <div className="w-5 h-5 rounded-full bg-blue-500" />
                      <div className="w-5 h-5 rounded-full bg-red-500" />
                      <div className="w-5 h-5 rounded-full bg-purple-500" />
                    </div>
                    <span className="flex-1 text-left">{selectedNetwork}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {networkDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                      {NETWORKS.map((network) => (
                        <button
                          key={network}
                          onClick={() => {
                            setSelectedNetwork(network);
                            setNetworkDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-secondary/50 transition-colors"
                        >
                          {network}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

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

                {/* Pool Type Filters */}
                <div className="flex gap-2">
                  {["All", "V3", "V2", "Stable"].map((type) => (
                    <button
                      key={type}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        type === "All"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pools Table */}
            <div className="glass-card rounded-2xl border border-glass-border overflow-hidden">
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
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center text-sm border border-border">
                          {TOKEN_ICONS[pool.token0]}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center text-sm border border-border">
                          {TOKEN_ICONS[pool.token1]}
                        </div>
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
                  {/* Position Status Tabs */}
                  <div className="flex items-center gap-6 px-6 py-4 border-b border-border">
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
                  
                  {/* Empty State */}
                  <div className="px-6 py-16 text-center">
                    <p className="text-muted-foreground mb-4">No positions found</p>
                    <p className="text-sm text-muted-foreground mb-6">Connect your wallet to view your liquidity positions</p>
                    <Button variant="swap" onClick={() => setAddLiquidityOpen(true)}>Add Liquidity</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />

        <AddLiquidityModal isOpen={addLiquidityOpen} onClose={() => setAddLiquidityOpen(false)} />
        <CreatePoolModal isOpen={createPoolOpen} onClose={() => setCreatePoolOpen(false)} />
      </div>
    </>
  );
};

export default Pools;

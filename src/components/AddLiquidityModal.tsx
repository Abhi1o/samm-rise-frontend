import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface AddLiquidityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOKENS = [
  { symbol: "ETH", name: "Ethereum", icon: "⟠" },
  { symbol: "USDC", name: "USD Coin", icon: "💲" },
  { symbol: "USDT", name: "Tether", icon: "💵" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", icon: "₿" },
  { symbol: "DAI", name: "Dai", icon: "◈" },
];

const CHAINS = [
  { name: "Ethereum", icon: "⟠" },
  { name: "Arbitrum", icon: "🔵" },
  { name: "Optimism", icon: "🔴" },
  { name: "Polygon", icon: "🟣" },
];

const AddLiquidityModal = ({ isOpen, onClose }: AddLiquidityModalProps) => {
  const [poolType, setPoolType] = useState<"V2" | "V3">("V3");
  const [selectedChain, setSelectedChain] = useState(CHAINS[0]);
  const [token0, setToken0] = useState(TOKENS[0]);
  const [token1, setToken1] = useState(TOKENS[1]);
  const [chainDropdownOpen, setChainDropdownOpen] = useState(false);
  const [token0DropdownOpen, setToken0DropdownOpen] = useState(false);
  const [token1DropdownOpen, setToken1DropdownOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add Liquidity</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Step 1: Select Pool Type */}
          <div>
            <p className="text-sm text-primary font-semibold mb-3">1. SELECT WHERE TO PROVIDE LIQUIDITY</p>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setPoolType("V3")}
                className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                  poolType === "V3"
                    ? "bg-primary/20 text-primary border border-primary"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                }`}
              >
                V3
              </button>
              <button
                onClick={() => setPoolType("V2")}
                className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                  poolType === "V2"
                    ? "bg-primary/20 text-primary border border-primary"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                }`}
              >
                V2
              </button>
            </div>

            {/* Chain Selector */}
            <div className="relative">
              <button
                onClick={() => setChainDropdownOpen(!chainDropdownOpen)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
              >
                <span className="text-xl">{selectedChain.icon}</span>
                <span className="flex-1 text-left font-medium">{selectedChain.name}</span>
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </button>
              {chainDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                  {CHAINS.map((chain) => (
                    <button
                      key={chain.name}
                      onClick={() => {
                        setSelectedChain(chain);
                        setChainDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
                    >
                      <span className="text-xl">{chain.icon}</span>
                      <span>{chain.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Choose Token Pair */}
          <div>
            <p className="text-sm text-primary font-semibold mb-3">2. CHOOSE TOKEN PAIR</p>
            <div className="flex items-center gap-3">
              {/* Token 0 Selector */}
              <div className="relative flex-1">
                <button
                  onClick={() => setToken0DropdownOpen(!token0DropdownOpen)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
                >
                  <span className="text-xl">{token0.icon}</span>
                  <span className="flex-1 text-left font-bold">{token0.symbol}</span>
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </button>
                {token0DropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                    {TOKENS.filter(t => t.symbol !== token1.symbol).map((token) => (
                      <button
                        key={token.symbol}
                        onClick={() => {
                          setToken0(token);
                          setToken0DropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
                      >
                        <span className="text-xl">{token.icon}</span>
                        <span className="font-medium">{token.symbol}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span className="text-muted-foreground text-xl">+</span>

              {/* Token 1 Selector */}
              <div className="relative flex-1">
                <button
                  onClick={() => setToken1DropdownOpen(!token1DropdownOpen)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
                >
                  <span className="text-xl">{token1.icon}</span>
                  <span className="flex-1 text-left font-bold">{token1.symbol}</span>
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </button>
                {token1DropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                    {TOKENS.filter(t => t.symbol !== token0.symbol).map((token) => (
                      <button
                        key={token.symbol}
                        onClick={() => {
                          setToken1(token);
                          setToken1DropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
                      >
                        <span className="text-xl">{token.icon}</span>
                        <span className="font-medium">{token.symbol}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Next Button */}
          <Button
            variant="swap"
            size="lg"
            className="w-full rounded-xl py-6 text-lg font-bold"
            onClick={onClose}
          >
            Next
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddLiquidityModal;

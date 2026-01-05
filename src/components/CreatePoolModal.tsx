import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface CreatePoolModalProps {
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

const FEE_TIERS = ["0.01%", "0.05%", "0.25%", "0.30%", "1.00%"];

const CreatePoolModal = ({ isOpen, onClose }: CreatePoolModalProps) => {
  const [token0, setToken0] = useState(TOKENS[0]);
  const [token1, setToken1] = useState(TOKENS[1]);
  const [token0DropdownOpen, setToken0DropdownOpen] = useState(false);
  const [token1DropdownOpen, setToken1DropdownOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState("0.25%");
  const [amount0, setAmount0] = useState("");
  const [amount1, setAmount1] = useState("");
  const [slippage, setSlippage] = useState("0.50");
  const [mevProtect, setMevProtect] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create Pool</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Choose Token Pair */}
          <div>
            <p className="text-sm text-primary font-semibold mb-3">CHOOSE TOKEN PAIR</p>
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

          {/* Fee Level */}
          <div>
            <p className="text-sm text-primary font-semibold mb-3">FEE LEVEL</p>
            <button className="px-4 py-2.5 rounded-xl bg-secondary/80 border border-border font-medium">
              {selectedFee}
            </button>
          </div>

          {/* Fee Tier Selection */}
          <div className="flex flex-wrap gap-2">
            {FEE_TIERS.map((fee) => (
              <button
                key={fee}
                onClick={() => setSelectedFee(fee)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedFee === fee
                    ? "bg-secondary/80 border border-border text-foreground"
                    : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                }`}
              >
                {fee}
              </button>
            ))}
          </div>

          {/* Deposit Amount */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-primary font-semibold">DEPOSIT AMOUNT</p>
              <span className="text-sm text-muted-foreground">📋 0</span>
            </div>
            
            {/* Token 0 Input */}
            <div className="bg-secondary/30 rounded-xl p-4 mb-3 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{token0.icon}</span>
                  <div>
                    <p className="font-bold">{token0.symbol}</p>
                    <p className="text-xs text-muted-foreground">Ethereum</p>
                  </div>
                </div>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount0}
                  onChange={(e) => setAmount0(e.target.value)}
                  className="w-32 text-right text-xl font-semibold bg-transparent border-none focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="flex justify-end mb-3">
              <span className="text-sm text-muted-foreground">📋 0</span>
            </div>

            {/* Token 1 Input */}
            <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{token1.icon}</span>
                  <div>
                    <p className="font-bold">{token1.symbol}</p>
                    <p className="text-xs text-muted-foreground">Ethereum</p>
                  </div>
                </div>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount1}
                  onChange={(e) => setAmount1(e.target.value)}
                  className="w-32 text-right text-xl font-semibold bg-transparent border-none focus-visible:ring-0"
                />
              </div>
            </div>
          </div>

          {/* Slippage Tolerance */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Slippage Tolerance</span>
            <button className="px-3 py-1.5 rounded-lg border border-primary/50 text-primary text-sm flex items-center gap-1">
              {slippage}% ✏️
            </button>
          </div>

          {/* MEV Protect */}
          <div className="flex items-center justify-between bg-secondary/20 rounded-xl p-4 border border-border/30">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <span className="text-muted-foreground">Enable <span className="font-semibold text-foreground">MEV Protect</span></span>
            </div>
            <Switch checked={mevProtect} onCheckedChange={setMevProtect} />
          </div>

          {/* Create Pool Button */}
          <Button
            variant="swap"
            size="lg"
            className="w-full rounded-xl py-6 text-lg font-bold opacity-50"
            disabled
          >
            Enter an amount
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePoolModal;

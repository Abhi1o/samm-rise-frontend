import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Shield, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNetwork } from "@/contexts/NetworkContext";
import { getTokensForChain } from "@/config/tokens";
import TokenLogo from "./TokenLogo";
import { useToast } from "@/hooks/use-toast";

interface CreatePoolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreatePoolModal = ({ isOpen, onClose }: CreatePoolModalProps) => {
  const { selectedNetwork } = useNetwork();
  const { toast } = useToast();

  // Get tokens for current network
  const tokens = selectedNetwork ? getTokensForChain(selectedNetwork.chainId) : [];

  // State
  const [selectedToken0, setSelectedToken0] = useState(tokens[0]);
  const [selectedToken1, setSelectedToken1] = useState(tokens[1]);
  const [token0DropdownOpen, setToken0DropdownOpen] = useState(false);
  const [token1DropdownOpen, setToken1DropdownOpen] = useState(false);
  const [amount0, setAmount0] = useState("");
  const [amount1, setAmount1] = useState("");
  const [slippage, setSlippage] = useState("0.50");
  const [mevProtect, setMevProtect] = useState(false);

  // SAMM Parameters (advanced)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [beta1, setBeta1] = useState("1000000"); // Default SAMM parameter
  const [rmin, setRmin] = useState("500000"); // Default SAMM parameter
  const [rmax, setRmax] = useState("2000000"); // Default SAMM parameter
  const [cThreshold, setCThreshold] = useState("100000"); // Default SAMM parameter

  // Update tokens when network changes
  useEffect(() => {
    if (tokens.length >= 2) {
      setSelectedToken0(tokens[0]);
      setSelectedToken1(tokens[1]);
    }
  }, [selectedNetwork]);

  const handleCreatePool = () => {
    toast({
      title: "Pool Creation Coming Soon",
      description: "Pool creation functionality will be available in the next update. For now, please use existing pools.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create SAMM Pool</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Network Display */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Network:</span>
            <span className="font-semibold text-foreground">
              {selectedNetwork?.displayName || "Not Connected"}
            </span>
          </div>

          {/* Info Banner */}
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-primary">SAMM Pool Creation</p>
              <p className="text-sm text-muted-foreground mt-1">
                SAMM uses a unique sharded AMM design. Each pool is automatically created with Small, Medium, and Large shards for optimal liquidity distribution.
              </p>
            </div>
          </div>

          {/* Token Pair Selection */}
          <div>
            <p className="text-sm text-primary font-semibold mb-3">CHOOSE TOKEN PAIR</p>
            <div className="flex items-center gap-3">
              {/* Token 0 Selector */}
              <div className="relative flex-1">
                <button
                  onClick={() => setToken0DropdownOpen(!token0DropdownOpen)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
                >
                  <TokenLogo
                    symbol={selectedToken0?.symbol || ""}
                    logoURI={selectedToken0?.logoURI}
                    icon={selectedToken0?.icon}
                    size="sm"
                  />
                  <span className="flex-1 text-left font-bold">{selectedToken0?.symbol}</span>
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </button>
                {token0DropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
                    {tokens.filter(t => t.symbol !== selectedToken1?.symbol).map((token) => (
                      <button
                        key={token.symbol}
                        onClick={() => {
                          setSelectedToken0(token);
                          setToken0DropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
                      >
                        <TokenLogo
                          symbol={token.symbol}
                          logoURI={token.logoURI}
                          icon={token.icon}
                          size="sm"
                        />
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
                  <TokenLogo
                    symbol={selectedToken1?.symbol || ""}
                    logoURI={selectedToken1?.logoURI}
                    icon={selectedToken1?.icon}
                    size="sm"
                  />
                  <span className="flex-1 text-left font-bold">{selectedToken1?.symbol}</span>
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </button>
                {token1DropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
                    {tokens.filter(t => t.symbol !== selectedToken0?.symbol).map((token) => (
                      <button
                        key={token.symbol}
                        onClick={() => {
                          setSelectedToken1(token);
                          setToken1DropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
                      >
                        <TokenLogo
                          symbol={token.symbol}
                          logoURI={token.logoURI}
                          icon={token.icon}
                          size="sm"
                        />
                        <span className="font-medium">{token.symbol}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Initial Liquidity */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-primary font-semibold">INITIAL LIQUIDITY</p>
            </div>
            
            {/* Token 0 Input */}
            <div className="bg-secondary/30 rounded-xl p-4 mb-3 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TokenLogo
                    symbol={selectedToken0?.symbol || ""}
                    logoURI={selectedToken0?.logoURI}
                    icon={selectedToken0?.icon}
                    size="sm"
                  />
                  <div>
                    <p className="font-bold">{selectedToken0?.symbol}</p>
                    <p className="text-xs text-muted-foreground">{selectedToken0?.name}</p>
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

            {/* Token 1 Input */}
            <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TokenLogo
                    symbol={selectedToken1?.symbol || ""}
                    logoURI={selectedToken1?.logoURI}
                    icon={selectedToken1?.icon}
                    size="sm"
                  />
                  <div>
                    <p className="font-bold">{selectedToken1?.symbol}</p>
                    <p className="text-xs text-muted-foreground">{selectedToken1?.name}</p>
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

          {/* Advanced SAMM Parameters */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-primary hover:underline mb-3"
            >
              {showAdvanced ? "Hide" : "Show"} Advanced SAMM Parameters
            </button>
            
            {showAdvanced && (
              <div className="space-y-3 bg-secondary/20 rounded-xl p-4 border border-border/30">
                <p className="text-xs text-muted-foreground mb-2">
                  These parameters control the SAMM curve behavior. Use default values unless you understand the implications.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Beta1</label>
                    <Input
                      type="number"
                      value={beta1}
                      onChange={(e) => setBeta1(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">R Min</label>
                    <Input
                      type="number"
                      value={rmin}
                      onChange={(e) => setRmin(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">R Max</label>
                    <Input
                      type="number"
                      value={rmax}
                      onChange={(e) => setRmax(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">C Threshold</label>
                    <Input
                      type="number"
                      value={cThreshold}
                      onChange={(e) => setCThreshold(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
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
            className="w-full rounded-xl py-6 text-lg font-bold"
            onClick={handleCreatePool}
            disabled={!amount0 || !amount1}
          >
            {!amount0 || !amount1 ? "Enter amounts" : "Create Pool (Coming Soon)"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Pool creation requires factory owner permissions. Contact the protocol team to create new pools.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePoolModal;

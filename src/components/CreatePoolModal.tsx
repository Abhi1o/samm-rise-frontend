import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Shield, AlertCircle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNetwork } from "@/contexts/NetworkContext";
import { getTokensForChain } from "@/config/tokens";
import TokenLogo from "./TokenLogo";
import { useToast } from "@/hooks/use-toast";
import { useBatchCreatePool } from "@/hooks/useBatchCreatePool";
import { useAccount } from "wagmi";

interface CreatePoolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreatePoolModal = ({ isOpen, onClose }: CreatePoolModalProps) => {
  const { selectedNetwork } = useNetwork();
  const { toast } = useToast();
  const { address: userAddress } = useAccount();

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
  const [useDefaultParams, setUseDefaultParams] = useState(true);
  const [beta1, setBeta1] = useState("-1050000"); // Default: -1.05 * 1e6
  const [rmin, setRmin] = useState("1000"); // Default: 0.001 * 1e6
  const [rmax, setRmax] = useState("12000"); // Default: 0.012 * 1e6
  const [cThreshold, setCThreshold] = useState("10400"); // Default: 0.0104 * 1e6

  // Fee parameters
  const [tradeFeeNum, setTradeFeeNum] = useState("25"); // 0.25%
  const [tradeFeeDenom, setTradeFeeDenom] = useState("10000");
  const [ownerFeeNum, setOwnerFeeNum] = useState("5"); // 0.05%
  const [ownerFeeDenom, setOwnerFeeDenom] = useState("10000");

  // Update tokens when network changes
  useEffect(() => {
    if (tokens.length >= 2) {
      setSelectedToken0(tokens[0]);
      setSelectedToken1(tokens[1]);
    }
  }, [selectedNetwork]);

  // Prepare SAMM and Fee params (only if not using defaults)
  const sammParams = useMemo(() => {
    if (useDefaultParams) return undefined;
    return {
      beta1: BigInt(beta1),
      rmin: BigInt(rmin),
      rmax: BigInt(rmax),
      c: BigInt(cThreshold),
    };
  }, [useDefaultParams, beta1, rmin, rmax, cThreshold]);

  const feeParams = useMemo(() => {
    if (useDefaultParams) return undefined;
    return {
      tradeFeeNumerator: BigInt(tradeFeeNum),
      tradeFeeDenominator: BigInt(tradeFeeDenom),
      ownerFeeNumerator: BigInt(ownerFeeNum),
      ownerFeeDenominator: BigInt(ownerFeeDenom),
    };
  }, [useDefaultParams, tradeFeeNum, tradeFeeDenom, ownerFeeNum, ownerFeeDenom]);

  // Initialize batch create pool hook
  const batchCreatePool = useBatchCreatePool({
    token0: selectedToken0,
    token1: selectedToken1,
    amount0,
    amount1,
    sammParams,
    feeParams,
    useDefaultParams,
  });

  const handleCreatePool = async () => {
    if (!userAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to create a pool",
        variant: "destructive",
      });
      return;
    }

    if (!amount0 || !amount1) {
      toast({
        title: "Missing Amounts",
        description: "Please enter initial liquidity amounts",
        variant: "destructive",
      });
      return;
    }

    try {
      await batchCreatePool.executeBatchCreatePool();
    } catch (err: any) {
      console.error('[CreatePoolModal] Error:', err);
      // Error toast is handled in the hook
    }
  };

  const closeAndReset = () => {
    batchCreatePool.reset();
    setAmount0("");
    setAmount1("");
    onClose();
  };

  // Button text based on current step
  const getButtonText = () => {
    if (!userAddress) return "Connect Wallet";
    if (!amount0 || !amount1) return "Enter Initial Liquidity";

    switch (batchCreatePool.currentStep) {
      case 'checking':
        return "Sign Transaction";
      case 'approving_token0':
        return `Processing Approval (${selectedToken0?.symbol})...`;
      case 'approved_token0':
        return "Sign Next Transaction";
      case 'approving_token1':
        return `Processing Approval (${selectedToken1?.symbol})...`;
      case 'approved_token1':
        return "Sign Transaction";
      case 'creating_shard':
        return "Creating Pool Shard...";
      case 'created_shard':
        return "Sign Initialization...";
      case 'initializing_shard':
        return "Initializing Pool...";
      case 'success':
        return "Pool Created & Initialized ✓";
      case 'error':
        return "Try Again";
      default:
        const needsApprovals = batchCreatePool.steps.filter(s => s.label.includes('Approve')).length;
        return needsApprovals > 0 ? "Approve & Create Pool" : "Create Pool";
    }
  };

  const isButtonDisabled =
    !userAddress ||
    !amount0 ||
    !amount1 ||
    batchCreatePool.isLoading ||
    batchCreatePool.currentStep === 'success';

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
              {showAdvanced ? "Hide" : "Show"} Advanced Parameters
            </button>

            {showAdvanced && (
              <div className="space-y-4 bg-secondary/20 rounded-xl p-4 border border-border/30">
                {/* Use Default Parameters Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Use Default Parameters</p>
                    <p className="text-xs text-muted-foreground">Recommended for most pools</p>
                  </div>
                  <Switch checked={useDefaultParams} onCheckedChange={setUseDefaultParams} />
                </div>

                {!useDefaultParams && (
                  <>
                    <p className="text-xs text-muted-foreground pt-2 border-t border-border/30">
                      SAMM curve parameters (scaled by 1e6). Only modify if you understand the implications.
                    </p>

                    {/* SAMM Parameters */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Beta1 (-1.05 * 1e6)</label>
                        <Input
                          type="number"
                          value={beta1}
                          onChange={(e) => setBeta1(e.target.value)}
                          className="mt-1"
                          disabled={useDefaultParams}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">R Min (0.001 * 1e6)</label>
                        <Input
                          type="number"
                          value={rmin}
                          onChange={(e) => setRmin(e.target.value)}
                          className="mt-1"
                          disabled={useDefaultParams}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">R Max (0.012 * 1e6)</label>
                        <Input
                          type="number"
                          value={rmax}
                          onChange={(e) => setRmax(e.target.value)}
                          className="mt-1"
                          disabled={useDefaultParams}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">C Threshold (0.0104 * 1e6)</label>
                        <Input
                          type="number"
                          value={cThreshold}
                          onChange={(e) => setCThreshold(e.target.value)}
                          className="mt-1"
                          disabled={useDefaultParams}
                        />
                      </div>
                    </div>

                    {/* Fee Parameters */}
                    <p className="text-xs text-muted-foreground pt-2 border-t border-border/30">
                      Fee parameters (numerator/denominator format)
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Trade Fee Numerator</label>
                        <Input
                          type="number"
                          value={tradeFeeNum}
                          onChange={(e) => setTradeFeeNum(e.target.value)}
                          className="mt-1"
                          disabled={useDefaultParams}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Trade Fee Denominator</label>
                        <Input
                          type="number"
                          value={tradeFeeDenom}
                          onChange={(e) => setTradeFeeDenom(e.target.value)}
                          className="mt-1"
                          disabled={useDefaultParams}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Owner Fee Numerator</label>
                        <Input
                          type="number"
                          value={ownerFeeNum}
                          onChange={(e) => setOwnerFeeNum(e.target.value)}
                          className="mt-1"
                          disabled={useDefaultParams}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Owner Fee Denominator</label>
                        <Input
                          type="number"
                          value={ownerFeeDenom}
                          onChange={(e) => setOwnerFeeDenom(e.target.value)}
                          className="mt-1"
                          disabled={useDefaultParams}
                        />
                      </div>
                    </div>
                  </>
                )}
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

          {/* Transaction Progress */}
          {batchCreatePool.currentStep !== 'idle' &&
            batchCreatePool.currentStep !== 'success' &&
            batchCreatePool.currentStep !== 'error' && (
              <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <p className="text-sm font-semibold">Transaction in Progress</p>
                </div>

                <div className="space-y-2">
                  {batchCreatePool.steps.map((step, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 text-sm ${
                        step.status === 'complete'
                          ? 'text-green-500'
                          : step.status === 'active'
                          ? 'text-primary font-semibold'
                          : step.status === 'error'
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {step.status === 'complete' && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                      {step.status === 'active' && <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />}
                      {step.status === 'error' && <XCircle className="w-4 h-4 flex-shrink-0" />}
                      {step.status === 'pending' && (
                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                      )}
                      <span>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Success State */}
          {batchCreatePool.currentStep === 'success' && (
            <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20 w-full overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                <h3 className="text-lg font-bold text-green-500">Pool Created & Initialized!</h3>
              </div>

              <p className="text-sm text-muted-foreground mb-4 break-words">
                Your pool has been successfully created and initialized with liquidity. The pool is now live and ready for trading!
              </p>

              {batchCreatePool.createdPoolAddress && (
                <div className="bg-secondary/30 rounded-lg p-3 mb-4 w-full overflow-hidden">
                  <p className="text-xs text-muted-foreground mb-2 font-semibold">Pool Address</p>
                  <div className="flex items-start gap-2 w-full min-w-0">
                    <p className="text-xs font-mono text-primary break-all flex-1 min-w-0">
                      {batchCreatePool.createdPoolAddress}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(batchCreatePool.createdPoolAddress || '');
                        toast({ title: "Copied!", description: "Pool address copied to clipboard" });
                      }}
                      className="text-xs text-primary hover:text-primary/80 flex-shrink-0 whitespace-nowrap px-2 py-1 bg-primary/10 rounded"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3 mb-4 w-full">
                <p className="text-xs text-muted-foreground font-semibold">Transaction Hashes:</p>
                {batchCreatePool.steps
                  .filter((s) => s.hash)
                  .map((step, index) => (
                    <div key={index} className="bg-secondary/30 rounded-lg p-3 w-full overflow-hidden">
                      <p className="text-xs text-muted-foreground mb-2">{step.label}</p>
                      <div className="flex items-start gap-2 w-full min-w-0">
                        <a
                          href={`https://explorer.testnet.riselabs.xyz/tx/${step.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-primary hover:underline break-all flex-1 min-w-0"
                          title={step.hash}
                        >
                          {step.hash}
                        </a>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(step.hash || '');
                            toast({ title: "Copied!", description: "Transaction hash copied to clipboard" });
                          }}
                          className="text-xs text-primary hover:text-primary/80 flex-shrink-0 whitespace-nowrap px-2 py-1 bg-primary/10 rounded"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              <Button onClick={closeAndReset} variant="swap" className="w-full">
                Done
              </Button>
            </div>
          )}

          {/* Error State */}
          {batchCreatePool.currentStep === 'error' && batchCreatePool.error && (
            <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-3 mb-3">
                <XCircle className="w-6 h-6 text-destructive" />
                <h3 className="text-lg font-bold text-destructive">Transaction Failed</h3>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{batchCreatePool.error.message}</p>

              <Button onClick={() => batchCreatePool.reset()} variant="swap" className="w-full">
                Try Again
              </Button>
            </div>
          )}

          {/* Create Pool Button */}
          {batchCreatePool.currentStep !== 'success' && batchCreatePool.currentStep !== 'error' && (
            <Button
              variant="swap"
              size="lg"
              className="w-full rounded-xl py-6 text-lg font-bold"
              onClick={handleCreatePool}
              disabled={isButtonDisabled}
            >
              {batchCreatePool.isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {getButtonText()}
            </Button>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Creating a pool will deploy a new shard for the selected token pair.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePoolModal;

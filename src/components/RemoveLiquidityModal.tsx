import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import TokenLogo from "./TokenLogo";
import { formatUnits, parseUnits, Address } from "viem";
import { useRemoveLiquidity } from "@/hooks/useRemoveLiquidity";
import { useToast } from "@/hooks/use-toast";
import { UserPosition } from "@/hooks/useUserPositions";
import { getTokensForChain } from "@/config/tokens";
import { useNetwork } from "@/contexts/NetworkContext";
import { Slider } from "@/components/ui/slider";

interface RemoveLiquidityModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: UserPosition | null;
}

const RemoveLiquidityModal = ({ isOpen, onClose, position }: RemoveLiquidityModalProps) => {
  const { selectedNetwork } = useNetwork();
  const { toast } = useToast();
  const { removeLiquidity, isLoading: isRemoving } = useRemoveLiquidity();

  // State
  const [percentage, setPercentage] = useState(100);
  const [slippage, setSlippage] = useState(0.5);

  // Get tokens for current network
  const tokens = selectedNetwork ? getTokensForChain(selectedNetwork.chainId) : [];

  // Find token details
  const token0 = useMemo(() => {
    if (!position) return null;
    return tokens.find(t => t.symbol === position.token0Symbol);
  }, [tokens, position]);

  const token1 = useMemo(() => {
    if (!position) return null;
    return tokens.find(t => t.symbol === position.token1Symbol);
  }, [tokens, position]);

  // Calculate amounts based on percentage
  const calculatedAmounts = useMemo(() => {
    if (!position || !token0 || !token1) return null;

    const lpToRemove = (position.lpBalance * BigInt(percentage)) / 100n;
    const token0Amount = (BigInt(position.token0Amount) * BigInt(percentage)) / 100n;
    const token1Amount = (BigInt(position.token1Amount) * BigInt(percentage)) / 100n;

    // Apply slippage protection
    const slippageMultiplier = 1 - slippage / 100;
    const token0Min = (token0Amount * BigInt(Math.floor(slippageMultiplier * 10000))) / 10000n;
    const token1Min = (token1Amount * BigInt(Math.floor(slippageMultiplier * 10000))) / 10000n;

    return {
      lpToRemove,
      token0Amount,
      token1Amount,
      token0Min,
      token1Min,
      token0Formatted: parseFloat(formatUnits(token0Amount, token0.decimals)).toFixed(6),
      token1Formatted: parseFloat(formatUnits(token1Amount, token1.decimals)).toFixed(6),
    };
  }, [position, token0, token1, percentage, slippage]);

  // Handle remove liquidity
  const handleRemoveLiquidity = async () => {
    if (!position || !token0 || !token1 || !calculatedAmounts) {
      toast({
        title: "Missing Information",
        description: "Unable to calculate removal amounts",
        variant: "destructive",
      });
      return;
    }

    if (calculatedAmounts.lpToRemove === 0n) {
      toast({
        title: "Invalid Amount",
        description: "Please select an amount to remove",
        variant: "destructive",
      });
      return;
    }

    try {
      await removeLiquidity({
        poolAddress: position.poolAddress,
        liquidity: calculatedAmounts.lpToRemove,
        amountAMin: calculatedAmounts.token0Min,
        amountBMin: calculatedAmounts.token1Min,
        token0Symbol: position.token0Symbol,
        token1Symbol: position.token1Symbol,
      });

      // Reset and close on success
      setPercentage(100);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error("Remove liquidity error:", error);
    }
  };

  const handlePresetClick = (value: number) => {
    setPercentage(value);
  };

  if (!position) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Remove Liquidity</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Position Info */}
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="flex -space-x-2">
              <TokenLogo
                symbol={position.token0Symbol}
                logoURI={token0?.logoURI}
                icon={token0?.icon}
                size="md"
                className="border-2 border-background"
              />
              <TokenLogo
                symbol={position.token1Symbol}
                logoURI={token1?.logoURI}
                icon={token1?.icon}
                size="md"
                className="border-2 border-background"
              />
            </div>
            <div>
              <p className="font-semibold text-lg">{position.pairName}</p>
              <p className="text-sm text-muted-foreground">{position.poolName}</p>
            </div>
          </div>

          {/* Amount Selection */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-semibold text-primary">AMOUNT TO REMOVE</p>
              <p className="text-2xl font-bold text-primary">{percentage}%</p>
            </div>

            {/* Slider */}
            <Slider
              value={[percentage]}
              onValueChange={(value) => setPercentage(value[0])}
              min={0}
              max={100}
              step={1}
              className="mb-4"
            />

            {/* Preset Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 75, 100].map((value) => (
                <button
                  key={value}
                  onClick={() => handlePresetClick(value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    percentage === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {value === 100 ? "MAX" : `${value}%`}
                </button>
              ))}
            </div>
          </div>

          {/* LP Tokens to Burn */}
          <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
            <p className="text-sm text-muted-foreground mb-2">LP Tokens to Burn</p>
            <p className="text-lg font-bold">
              {calculatedAmounts ? (Number(calculatedAmounts.lpToRemove) / 1e18).toFixed(6) : "0.00"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total: {position.lpBalanceFormatted}
            </p>
          </div>

          {/* You Will Receive */}
          <div>
            <p className="text-sm font-semibold text-primary mb-3">YOU WILL RECEIVE</p>
            
            {/* Token 0 */}
            <div className="bg-secondary/30 rounded-xl p-4 mb-3 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TokenLogo
                    symbol={position.token0Symbol}
                    logoURI={token0?.logoURI}
                    icon={token0?.icon}
                    size="sm"
                  />
                  <span className="font-bold">{position.token0Symbol}</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    {calculatedAmounts?.token0Formatted || "0.00"}
                  </p>
                </div>
              </div>
            </div>

            {/* Token 1 */}
            <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TokenLogo
                    symbol={position.token1Symbol}
                    logoURI={token1?.logoURI}
                    icon={token1?.icon}
                    size="sm"
                  />
                  <span className="font-bold">{position.token1Symbol}</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    {calculatedAmounts?.token1Formatted || "0.00"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Slippage Tolerance */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Slippage Tolerance</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                className="w-16 px-2 py-1 text-right bg-secondary/50 border border-border rounded-lg"
                step="0.1"
                min="0.1"
                max="50"
              />
              <span>%</span>
            </div>
          </div>

          {/* Remove Button */}
          <Button
            variant="destructive"
            size="lg"
            className="w-full rounded-xl py-6 text-lg font-bold"
            onClick={handleRemoveLiquidity}
            disabled={isRemoving || percentage === 0}
          >
            {isRemoving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Removing Liquidity...
              </>
            ) : (
              "Remove Liquidity"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RemoveLiquidityModal;

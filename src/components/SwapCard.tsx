import { useState } from "react";
import { ArrowDown, Settings, RefreshCw } from "lucide-react";
import TokenInput from "./TokenInput";
import TokenSelectModal, { Token } from "./TokenSelectModal";
import { Button } from "./ui/button";

const SwapCard = () => {
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectingFor, setSelectingFor] = useState<"from" | "to">("from");

  const [fromToken, setFromToken] = useState({
    symbol: "ETH",
    icon: "⟠",
    balance: "2.4521",
  });

  const [toToken, setToToken] = useState({
    symbol: "USDC",
    icon: "💲",
    balance: "1,234.56",
  });

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    const tempValue = fromValue;
    setFromValue(toValue);
    setToValue(tempValue);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const openTokenModal = (type: "from" | "to") => {
    setSelectingFor(type);
    setModalOpen(true);
  };

  const handleTokenSelect = (token: Token) => {
    if (selectingFor === "from") {
      setFromToken({
        symbol: token.symbol,
        icon: token.icon,
        balance: token.balance || "0.00",
      });
    } else {
      setToToken({
        symbol: token.symbol,
        icon: token.icon,
        balance: token.balance || "0.00",
      });
    }
  };

  return (
    <>
      <div className="w-full max-w-[420px] mx-auto">
        <div className="glass-card rounded-3xl p-5 md:p-6 metal-shine">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-foreground">Swap</h2>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-xl hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground">
                <RefreshCw className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-xl hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* From Token */}
          <TokenInput
            label="You pay"
            token={fromToken}
            value={fromValue}
            onChange={setFromValue}
            usdValue={fromValue ? (parseFloat(fromValue) * 2450).toFixed(2) : undefined}
            onTokenClick={() => openTokenModal("from")}
          />

          {/* Swap Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              onClick={handleSwapTokens}
              className="w-10 h-10 rounded-xl bg-secondary border-4 border-background flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300 group"
            >
              <ArrowDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
            </button>
          </div>

          {/* To Token */}
          <TokenInput
            label="You receive"
            token={toToken}
            value={toValue || (fromValue ? (parseFloat(fromValue) * 2450).toFixed(2) : "")}
            onChange={setToValue}
            isOutput
            onTokenClick={() => openTokenModal("to")}
          />

          {/* Price Info */}
          {fromValue && (
            <div className="mt-4 p-3 rounded-xl bg-secondary/30 border border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rate</span>
                <span className="text-foreground font-mono text-xs">1 ETH = 2,450 USDC</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted-foreground">Slippage</span>
                <span className="text-chrome font-mono text-xs">0.5%</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted-foreground">Network Fee</span>
                <span className="text-foreground font-mono text-xs">~$2.50</span>
              </div>
            </div>
          )}

          {/* Swap Action Button - Cursor Responsive */}
          <Button 
            variant="swap" 
            size="xl" 
            className="w-full mt-5 liquid-metal-cursor"
            onMouseMove={handleMouseMove}
            style={{
              '--mouse-x': `${mousePos.x}%`,
              '--mouse-y': `${mousePos.y}%`,
            } as React.CSSProperties}
          >
            {fromValue ? "Swap" : "Enter an amount"}
          </Button>
        </div>
      </div>

      <TokenSelectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleTokenSelect}
        excludeToken={selectingFor === "from" ? toToken.symbol : fromToken.symbol}
      />
    </>
  );
};

export default SwapCard;

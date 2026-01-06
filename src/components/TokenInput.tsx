import { ChevronDown } from "lucide-react";
import TokenLogo from "./TokenLogo";

interface TokenInputProps {
  label: string;
  token: {
    symbol: string;
    icon: string;
    logoURI?: string;
    balance?: string;
  };
  value: string;
  onChange: (value: string) => void;
  usdValue?: string;
  isOutput?: boolean;
  onTokenClick?: () => void;
}

const TokenInput = ({
  label,
  token,
  value,
  onChange,
  usdValue,
  isOutput = false,
  onTokenClick,
}: TokenInputProps) => {
  return (
    <div className="token-input group hover:border-chrome-dark transition-colors">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {token.balance && (
          <span className="text-sm text-muted-foreground">
            Balance: <span className="text-chrome">{token.balance}</span>
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.00"
          className="flex-1 min-w-0 bg-transparent text-2xl md:text-3xl font-semibold text-foreground placeholder:text-muted-foreground/50 outline-none font-mono"
          readOnly={isOutput}
        />
        
        <button
          onClick={onTokenClick}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/30 transition-all flex-shrink-0"
        >
          <TokenLogo
            symbol={token.symbol}
            logoURI={token.logoURI}
            icon={token.icon}
            size="md"
          />
          <span className="font-semibold text-foreground text-sm">{token.symbol}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      
      {usdValue && (
        <div className="mt-2 text-sm text-muted-foreground">
          ≈ ${usdValue}
        </div>
      )}
    </div>
  );
};

export default TokenInput;

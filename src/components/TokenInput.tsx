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
  isLoading?: boolean;
  isInsufficient?: boolean;
  onMax?: () => void;
  onTokenClick?: () => void;
}

const TokenInput = ({
  label,
  token,
  value,
  onChange,
  usdValue,
  isOutput = false,
  isLoading = false,
  isInsufficient = false,
  onMax,
  onTokenClick,
}: TokenInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow only valid decimal numbers
    if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
      onChange(raw);
    }
  };

  return (
    <div
      className={`token-input group transition-colors ${
        isInsufficient
          ? "border-destructive/60 hover:border-destructive/80"
          : "hover:border-chrome-dark"
      }`}
    >
      <div className="flex justify-between items-center mb-2 gap-2">
        <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
        {token.balance && (
          <div className="flex items-center gap-1.5 min-w-0">
            {!isOutput && onMax && (
              <button
                type="button"
                onClick={onMax}
                className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-primary/15 text-primary hover:bg-primary/25 transition-colors flex-shrink-0"
              >
                Max
              </button>
            )}
            <span
              className={`text-sm min-w-0 overflow-hidden text-right ${
                isInsufficient ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              Balance:{" "}
              <span
                className={`truncate inline-block max-w-[120px] sm:max-w-none align-bottom ${
                  isInsufficient ? "text-destructive font-semibold" : "text-chrome"
                }`}
              >
                {token.balance}
              </span>
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isOutput && isLoading ? (
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <div className="h-8 w-36 rounded-lg bg-secondary/60 animate-pulse" />
          </div>
        ) : (
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={isOutput ? undefined : handleChange}
            placeholder="0.00"
            className={`flex-1 min-w-0 bg-transparent text-2xl md:text-3xl font-semibold placeholder:text-muted-foreground/50 outline-none font-mono transition-colors ${
              isInsufficient ? "text-destructive" : "text-foreground"
            }`}
            readOnly={isOutput}
          />
        )}

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

      {!isLoading && usdValue && (
        <div className="mt-2 text-sm text-muted-foreground">≈ {usdValue}</div>
      )}
      {isOutput && isLoading && (
        <div className="mt-2">
          <div className="h-4 w-24 rounded bg-secondary/60 animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default TokenInput;

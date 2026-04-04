import { TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ComparisonResult } from '@/types/comparison';

interface Props {
  comparison: ComparisonResult | undefined;
  tokenIn: string;
  tokenOut: string;
  amount: string;
  isLoading?: boolean;
}

export function UniswapBadge({ comparison, tokenIn, tokenOut, amount, isLoading }: Props) {
  const navigate = useNavigate();

  if (isLoading || !comparison) return null;

  const delta = parseFloat(comparison.delta.percentage);
  if (Math.abs(delta) < 0.01) return null; // skip if negligible

  const sammWins = comparison.winner === 'samm';

  const handleClick = () => {
    navigate('/compare', {
      state: { tokenIn, tokenOut, amount },
    });
  };

  return (
    <button
      onClick={handleClick}
      className={`mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
        sammWins
          ? 'bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20'
          : 'bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20'
      }`}
    >
      {sammWins ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      <span>
        {sammWins
          ? `${Math.abs(delta).toFixed(2)}% better than Uniswap`
          : `${Math.abs(delta).toFixed(2)}% worse than Uniswap`}
      </span>
      <span className="opacity-60 ml-1">→ Compare</span>
    </button>
  );
}

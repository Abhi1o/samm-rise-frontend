import { TrendingUp, TrendingDown, Minus, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ComparisonResult } from '@/types/comparison';

interface Props {
  data: ComparisonResult;
}

export function ComparisonCard({ data }: Props) {
  const { samm, uniswap, delta, winner } = data;

  const deltaVal = parseFloat(delta.percentage);
  const isPositive = deltaVal > 0;
  const isEqual = winner === 'equal';

  const DeltaIcon = isEqual ? Minus : isPositive ? TrendingUp : TrendingDown;
  const deltaColor = isEqual
    ? 'text-muted-foreground'
    : isPositive
    ? 'text-green-400'
    : 'text-red-400';

  return (
    <div className="space-y-4">
      {/* Winner Banner */}
      <div
        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold ${
          isEqual
            ? 'bg-secondary/30 border-border text-muted-foreground'
            : winner === 'samm'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
        }`}
      >
        {!isEqual && <Trophy className="w-4 h-4" />}
        {isEqual
          ? 'Rates are equal'
          : winner === 'samm'
          ? `SAMM is ${Math.abs(deltaVal).toFixed(2)}% better for this trade`
          : `Uniswap is ${Math.abs(deltaVal).toFixed(2)}% better for this trade`}
      </div>

      {/* Side-by-side cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* SAMM */}
        <Card
          className={`border ${
            winner === 'samm'
              ? 'border-green-500/40 bg-green-500/5'
              : 'border-border bg-secondary/20'
          }`}
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">SAMM</span>
              {winner === 'samm' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-mono">
                  WINNER
                </span>
              )}
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">You receive</p>
              <p className="font-mono text-base font-semibold text-foreground">
                {parseFloat(samm.amountOut).toFixed(6)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Fee</p>
              <p className="font-mono text-xs text-foreground">{samm.fee}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Route</p>
              <p className="font-mono text-xs text-foreground break-all">{samm.route}</p>
            </div>
            {parseFloat(samm.priceImpact) > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Price Impact</p>
                <p className="font-mono text-xs text-yellow-400">{samm.priceImpact}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Uniswap */}
        <Card
          className={`border ${
            winner === 'uniswap'
              ? 'border-orange-500/40 bg-orange-500/5'
              : 'border-border bg-secondary/20'
          }`}
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Uniswap</span>
              {winner === 'uniswap' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-mono">
                  WINNER
                </span>
              )}
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">You receive</p>
              <p className="font-mono text-base font-semibold text-foreground">
                {parseFloat(uniswap.amountOut).toFixed(6)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Fee</p>
              <p className="font-mono text-xs text-foreground">{uniswap.fee}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Route</p>
              <p className="font-mono text-xs text-foreground break-all">{uniswap.route}</p>
            </div>
            {parseFloat(uniswap.priceImpact) > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Price Impact</p>
                <p className="font-mono text-xs text-yellow-400">{uniswap.priceImpact}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delta row */}
      <div className="flex items-center justify-center gap-2 text-sm">
        <DeltaIcon className={`w-4 h-4 ${deltaColor}`} />
        <span className={`font-mono font-semibold ${deltaColor}`}>
          {isEqual ? 'No difference' : `${Math.abs(deltaVal).toFixed(2)}% ${isPositive ? 'in SAMM\'s favour' : 'in Uniswap\'s favour'}`}
        </span>
        <span className="text-muted-foreground text-xs">
          ({delta.absolute} {data.tokenOut} difference)
        </span>
      </div>
    </div>
  );
}

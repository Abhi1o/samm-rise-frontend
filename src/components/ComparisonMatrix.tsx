import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useComparisonMatrix } from '@/hooks/useComparison';
import type { MatrixResult } from '@/types/comparison';

const PAIRS = ['WETH-USDC', 'USDC-USDT', 'WETH-USDT', 'WBTC-USDC', 'USDC-DAI'];

// Backend keys use no thousands separator: "$10", "$100", "$1000", "$5000"
// Display labels use formatted versions for readability
const AMOUNTS: { key: string; label: string }[] = [
  { key: '$10',   label: '$10' },
  { key: '$100',  label: '$100' },
  { key: '$1000', label: '$1,000' },
  { key: '$5000', label: '$5,000' },
];

function DeltaCell({ delta, winner }: { delta: string; winner: string }) {
  const val = parseFloat(delta);
  const isEqual = winner === 'equal' || val === 0;
  const sammWins = winner === 'samm';

  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-xs font-mono font-semibold ${
        isEqual
          ? 'bg-secondary/50 text-muted-foreground'
          : sammWins
          ? 'bg-green-500/15 text-green-400'
          : 'bg-red-500/15 text-red-400'
      }`}
    >
      {isEqual ? '=' : sammWins ? `+${Math.abs(val).toFixed(2)}%` : `-${Math.abs(val).toFixed(2)}%`}
    </span>
  );
}

function MatrixTable({ data, pair }: { data: MatrixResult; pair: string }) {
  // Try the exact pair key, then try reversed order (e.g. "USDC-WETH" vs "WETH-USDC")
  const pairData = data[pair] ?? data[pair.split('-').reverse().join('-')];

  if (!pairData) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No data available for {pair}
      </p>
    );
  }

  // Resolve a cell: try the canonical key, then common variants the backend might use
  const getCell = (key: string) => {
    return pairData[key]
      ?? pairData[key.replace('$', '').replace(',', '')]   // "$1000" fallback
      ?? pairData[key.replace(',', '')]                     // "$1,000" → "$1000"
      ?? null;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 pr-4 text-muted-foreground font-medium text-xs w-20">Protocol</th>
            {AMOUNTS.map(({ label }) => (
              <th key={label} className="text-right py-2 px-3 text-muted-foreground font-mono text-xs">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {/* SAMM row */}
          <tr>
            <td className="py-2.5 pr-4 font-semibold text-foreground text-xs">SAMM</td>
            {AMOUNTS.map(({ key, label }) => (
              <td key={label} className="py-2.5 px-3 text-right font-mono text-xs text-foreground">
                {getCell(key)?.samm ?? '—'}
              </td>
            ))}
          </tr>
          {/* Uniswap row */}
          <tr>
            <td className="py-2.5 pr-4 font-semibold text-muted-foreground text-xs">Uniswap</td>
            {AMOUNTS.map(({ key, label }) => (
              <td key={label} className="py-2.5 px-3 text-right font-mono text-xs text-muted-foreground">
                {getCell(key)?.uniswap ?? '—'}
              </td>
            ))}
          </tr>
          {/* Delta row */}
          <tr className="bg-secondary/10">
            <td className="py-2.5 pr-4 text-xs text-muted-foreground italic">Delta</td>
            {AMOUNTS.map(({ key, label }) => {
              const cell = getCell(key);
              return (
                <td key={label} className="py-2.5 px-3 text-right">
                  {cell ? (
                    <DeltaCell delta={cell.delta} winner={cell.winner} />
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
      <p className="text-[10px] text-muted-foreground mt-2 text-right">
        Green = SAMM advantage · Red = Uniswap advantage
      </p>
    </div>
  );
}

export function ComparisonMatrix() {
  const [activePair, setActivePair] = useState(PAIRS[0]);
  const { data, isLoading, isError, refetch } = useComparisonMatrix();

  return (
    <Card className="border-border bg-secondary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          Rate Comparison Matrix
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          SAMM vs Uniswap across all major pairs and trade sizes
        </p>
      </CardHeader>
      <CardContent>
        {/* Pair tabs */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {PAIRS.map((pair) => (
            <button
              key={pair}
              onClick={() => setActivePair(pair)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                activePair === pair
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              {pair.replace('-', ' / ')}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full bg-secondary/50" />
            ))}
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            <span className="text-xs text-destructive">Failed to load matrix data</span>
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto text-xs h-7">
              Retry
            </Button>
          </div>
        )}

        {data && <MatrixTable data={data} pair={activePair} />}
      </CardContent>
    </Card>
  );
}

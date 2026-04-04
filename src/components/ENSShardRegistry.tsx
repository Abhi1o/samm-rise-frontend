import { useState } from 'react';
import { Copy, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useShardRegistry } from '@/hooks/useAgents';

function CopyCell({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const truncated = `${value.slice(0, 6)}...${value.slice(-4)}`;
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {truncated}
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

const TIER_COLORS: Record<string, string> = {
  small: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  medium: 'bg-primary/10 text-primary border-primary/20',
  large: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export function ENSShardRegistry() {
  const { data, isLoading, isError, refetch } = useShardRegistry();

  return (
    <Card className="border-border bg-secondary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          ENS-Based Pool Discovery
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          All SAMM pools are discoverable via ENS subnames — no centralised registry file needed
        </p>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-full bg-secondary/50" />
            ))}
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            <span className="text-xs text-destructive flex-1">Failed to load shard registry</span>
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-xs h-7">
              Retry
            </Button>
          </div>
        )}

        {data && data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 text-muted-foreground font-medium text-xs">ENS Name</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Address</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">TVL</th>
                  <th className="text-right py-2 pl-3 text-muted-foreground font-medium text-xs">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {data.map((shard) => (
                  <tr key={shard.ensName} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-2.5 pr-3">
                      <a
                        href={`https://app.ens.domains/${shard.ensName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-primary hover:underline flex items-center gap-1 max-w-[220px] truncate"
                        title={shard.ensName}
                      >
                        {shard.ensName}
                        <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                      </a>
                    </td>
                    <td className="py-2.5 px-3">
                      <CopyCell value={shard.address} />
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-xs text-foreground">
                      {shard.tvl}
                    </td>
                    <td className="py-2.5 pl-3 text-right">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                          TIER_COLORS[shard.tier.toLowerCase()] ?? 'bg-secondary text-muted-foreground border-border'
                        }`}
                      >
                        {shard.tier}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">
            No shards registered via ENS yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}

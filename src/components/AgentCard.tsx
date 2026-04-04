import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgentDetail } from '@/hooks/useAgentDetail';
import type { Agent } from '@/types/agents';

function CopyableAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
      title={address}
    >
      {truncated}
      {copied ? (
        <Check className="w-3 h-3 text-green-400" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
    </button>
  );
}

function KVTable({ data, label }: { data: Record<string, string>; label: string }) {
  if (!data || Object.keys(data).length === 0) return null;
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5">{label}</p>
      <div className="rounded-lg border border-border/50 overflow-hidden">
        {Object.entries(data).map(([key, value], i) => (
          <div
            key={key}
            className={`flex items-center justify-between px-3 py-2 text-xs ${
              i > 0 ? 'border-t border-border/40' : ''
            }`}
          >
            <span className="font-mono text-muted-foreground truncate pr-4">
              {key.replace('com.samm.', '')}
            </span>
            <span className="font-mono text-foreground font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  agent: Agent;
}

export function AgentCard({ agent }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { data: detail, isLoading: detailLoading } = useAgentDetail(expanded ? agent.name : null);

  return (
    <Card className="border-border bg-secondary/10">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  agent.status === 'active' ? 'bg-green-400' : 'bg-muted-foreground'
                }`}
              />
              <h3 className="font-mono text-sm font-bold text-foreground truncate">
                {agent.name}
              </h3>
            </div>
            <CopyableAddress address={agent.address} />
          </div>
          <span
            className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium border ${
              agent.status === 'active'
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : 'bg-secondary text-muted-foreground border-border'
            }`}
          >
            {agent.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Config */}
        <KVTable data={agent.config} label="Configuration (ENS text records)" />

        {/* Stats */}
        <KVTable data={agent.stats} label="Performance (ENS text records)" />

        {/* View all records toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Hide all records
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              View all ENS text records
            </>
          )}
        </button>

        {expanded && (
          <div className="pt-1">
            {detailLoading && (
              <div className="space-y-1.5">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-7 w-full bg-secondary/50" />
                ))}
              </div>
            )}
            {detail && (
              <div className="space-y-3">
                <KVTable data={detail.allTextRecords} label="All text records" />
                {detail.registryContractAddress && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Registry contract:</span>
                    <a
                      href={`https://explorer.testnet.riselabs.xyz/address/${detail.registryContractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-primary hover:underline flex items-center gap-1"
                    >
                      {detail.registryContractAddress.slice(0, 10)}...
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

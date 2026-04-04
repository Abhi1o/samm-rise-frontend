import { useNavigate } from 'react-router-dom';
import { useOracleData } from '@/hooks/useOracleData';

export function CREStatusStrip() {
  const navigate = useNavigate();
  const { data } = useOracleData();

  const isActive = data?.creWorkflowStatus === 'active';
  const shards = data?.shardsMonitored ?? 20;

  const getTimeSince = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <button
      onClick={() => navigate('/portfolio')}
      className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-border bg-background/40 backdrop-blur-sm hover:border-primary/30 transition-colors animate-fade-in"
      style={{ animationDelay: '0.35s' }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          isActive ? 'bg-green-400' : 'bg-muted-foreground'
        }`}
      />
      <span className="text-xs font-mono text-muted-foreground tracking-wide">
        Chainlink CRE:{' '}
        <span className={isActive ? 'text-green-400' : 'text-muted-foreground'}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
        {data?.lastTriggered && (
          <> · Rebalanced {getTimeSince(data.lastTriggered)}</>
        )}
        {' · '}
        <span className="text-foreground/70">{shards}</span> shards monitored
      </span>
    </button>
  );
}

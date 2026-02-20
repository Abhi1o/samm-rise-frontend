import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Token } from "@/types/tokens";
import { Address } from "viem";

export interface ChecklistItem {
  id: string;
  label: string;
  passed: boolean;
  loading: boolean;
  details?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface PreTransactionChecklistProps {
  items: ChecklistItem[];
}

export function PreTransactionChecklist({ items }: PreTransactionChecklistProps) {
  const allPassed = items.every(item => item.passed);

  return (
    <div className="bg-secondary/20 rounded-xl p-4 border border-border/30">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold">Pre-Flight Checklist</p>
        {allPassed && (
          <span className="text-xs text-green-500 font-semibold">All checks passed ✓</span>
        )}
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              {item.loading ? (
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin flex-shrink-0" />
              ) : item.passed ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              )}
              <div className="flex-1">
                <span className={`text-sm ${item.passed ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
                {item.details && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.details}</p>
                )}
              </div>
            </div>
            {!item.passed && item.action && (
              <Button
                size="sm"
                variant="outline"
                onClick={item.action.onClick}
                className="ml-2 flex-shrink-0 h-7 text-xs"
              >
                {item.action.label}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

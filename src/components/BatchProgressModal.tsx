import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ProgressStep } from '@/types/batch';
import { CheckCircle2, Loader2, Circle, XCircle } from 'lucide-react';
import { Button } from './ui/button';

interface BatchProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  steps: ProgressStep[];
  canClose?: boolean; // Allow closing during process
}

export function BatchProgressModal({
  isOpen,
  onClose,
  title,
  steps,
  canClose = false,
}: BatchProgressModalProps) {
  const getStepIcon = (status: ProgressStep['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'active':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'pending':
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const allComplete = steps.every(step => step.status === 'complete');
  const hasError = steps.some(step => step.status === 'error');
  const activeStep = steps.find(step => step.status === 'active');

  return (
    <Dialog open={isOpen} onOpenChange={canClose ? onClose : undefined}>
      <DialogContent className="glass-card max-w-md" hideClose={!canClose && !allComplete && !hasError}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="mt-0.5">{getStepIcon(step.status)}</div>
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    step.status === 'active'
                      ? 'text-foreground'
                      : step.status === 'complete'
                      ? 'text-green-500'
                      : step.status === 'error'
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </p>
                {step.hash && (
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {step.hash.slice(0, 10)}...{step.hash.slice(-8)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Success/Error Actions */}
        {(allComplete || hasError) && (
          <div className="flex justify-end gap-2 pt-4 border-t border-glass-border">
            <Button onClick={onClose} variant={hasError ? 'destructive' : 'default'}>
              {hasError ? 'Close' : 'Done'}
            </Button>
          </div>
        )}

        {/* Real-time status message */}
        {activeStep && (
          <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-primary">{activeStep.label}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please confirm the transaction in your wallet
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Helpful tip during process */}
        {!allComplete && !hasError && !activeStep && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            Preparing transactions...
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

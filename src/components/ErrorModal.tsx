import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { XCircle, AlertTriangle } from "lucide-react";
import { parseContractError } from "@/utils/errorParser";
import { useNavigate } from "react-router-dom";

interface ErrorModalProps {
  isOpen: boolean;
  error: Error | null;
  context?: 'approval' | 'creation' | 'initialization';
  onRetry: () => void;
  onClose: () => void;
  onSwitchNetwork?: () => void;
}

export function ErrorModal({
  isOpen,
  error,
  context,
  onRetry,
  onClose,
  onSwitchNetwork,
}: ErrorModalProps) {
  const navigate = useNavigate();

  if (!error) return null;

  const parsedError = parseContractError(error);

  const handleAction = (action: string) => {
    switch (action) {
      case 'retry':
        onRetry();
        break;
      case 'openFaucet':
        navigate('/faucet');
        onClose();
        break;
      case 'openRiseFaucet':
        window.open('https://faucet.riselabs.xyz', '_blank');
        break;
      case 'switchNetwork':
        if (onSwitchNetwork) {
          onSwitchNetwork();
        }
        break;
      case 'close':
        onClose();
        break;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="w-5 h-5" />
            {parsedError.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Description */}
          <p className="text-sm text-muted-foreground">
            {parsedError.description}
          </p>

          {/* Context */}
          {context && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Error occurred during: <span className="font-semibold">{context}</span>
              </p>
            </div>
          )}

          {/* Technical Details (collapsible) */}
          {parsedError.technicalDetails && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Technical Details
              </summary>
              <pre className="mt-2 p-2 bg-secondary/50 rounded text-xs overflow-x-auto">
                {parsedError.technicalDetails}
              </pre>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {parsedError.actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'default'}
                onClick={() => handleAction(action.action)}
                className="flex-1"
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

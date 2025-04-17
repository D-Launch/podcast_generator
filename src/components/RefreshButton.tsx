import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";

interface RefreshButtonProps {
  onClick: () => void;
  isRefreshing: boolean;
  disabled: boolean;
}

export function RefreshButton({ onClick, isRefreshing, disabled }: RefreshButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={isRefreshing || disabled}
      title="Refresh script links"
      className="mr-2"
    >
      {isRefreshing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      <span className="ml-1">Refresh</span>
    </Button>
  );
}

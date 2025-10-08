import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WarningIndicatorProps {
  active: boolean;
  message?: string;
}

const WarningIndicator = ({ active, message = "Wall detected nearby" }: WarningIndicatorProps) => {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all",
        active 
          ? "bg-warning/10 border-warning text-warning-foreground animate-pulse" 
          : "bg-muted/50 border-border text-muted-foreground opacity-50"
      )}
    >
      <AlertTriangle className="h-5 w-5" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

export default WarningIndicator;

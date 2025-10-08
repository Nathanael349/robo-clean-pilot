import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ControlButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  active?: boolean;
  label: string;
  variant?: "default" | "destructive";
}

const ControlButton = ({ 
  icon: Icon, 
  onClick, 
  active, 
  label,
  variant = "default" 
}: ControlButtonProps) => {
  return (
    <Button
      onClick={onClick}
      variant={variant === "destructive" ? "destructive" : "outline"}
      size="lg"
      className={cn(
        "h-16 w-16 transition-all hover:scale-105 bg-control-bg border-2",
        "hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:border-primary",
        active && "bg-primary/20 text-primary border-primary shadow-[0_0_30px_rgba(0,255,255,0.5)] scale-105"
      )}
      aria-label={label}
    >
      <Icon className="h-6 w-6" />
    </Button>
  );
};

export default ControlButton;

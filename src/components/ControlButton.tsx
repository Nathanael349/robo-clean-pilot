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
        "h-16 w-16 transition-all hover:scale-105",
        active && "bg-accent text-accent-foreground border-accent hover:bg-accent"
      )}
      aria-label={label}
    >
      <Icon className="h-6 w-6" />
    </Button>
  );
};

export default ControlButton;

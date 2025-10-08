import { Slider } from "@/components/ui/slider";
import { Gauge } from "lucide-react";

interface SpeedControlProps {
  speed: number;
  onChange: (speed: number) => void;
}

const SpeedControl = ({ speed, onChange }: SpeedControlProps) => {
  return (
    <div className="flex flex-col gap-3 p-4 bg-card rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">Speed</span>
        </div>
        <span className="text-sm font-bold text-accent">{speed}%</span>
      </div>
      <Slider
        value={[speed]}
        onValueChange={(values) => onChange(values[0])}
        min={0}
        max={100}
        step={10}
        className="w-full"
      />
    </div>
  );
};

export default SpeedControl;

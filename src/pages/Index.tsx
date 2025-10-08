import { useState } from "react";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Power } from "lucide-react";
import CameraFeed from "@/components/CameraFeed";
import ControlButton from "@/components/ControlButton";
import WarningIndicator from "@/components/WarningIndicator";
import SpeedControl from "@/components/SpeedControl";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [activeDirection, setActiveDirection] = useState<string | null>(null);
  const [suctionActive, setSuctionActive] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [wallWarning, setWallWarning] = useState(false);
  const { toast } = useToast();

  const handleDirection = (direction: string) => {
    setActiveDirection(direction);
    toast({
      title: `Moving ${direction}`,
      description: `Speed: ${speed}%`,
    });
    // Send command to Flask backend here
    console.log(`Command: ${direction}, Speed: ${speed}`);
    
    // Reset active state after a short delay
    setTimeout(() => setActiveDirection(null), 200);
  };

  const toggleSuction = () => {
    setSuctionActive(!suctionActive);
    toast({
      title: suctionActive ? "Suction stopped" : "Suction started",
      variant: suctionActive ? "default" : "default",
    });
    // Send command to Flask backend here
    console.log(`Suction: ${!suctionActive ? 'ON' : 'OFF'}`);
  };

  // Simulate sensor data (replace with actual Flask API call)
  const simulateWallDetection = () => {
    setWallWarning(!wallWarning);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Vacuum Robot Control</h1>
          <p className="text-sm text-muted-foreground">Minimalist control interface</p>
        </header>

        {/* Camera Feed */}
        <section>
          <CameraFeed />
        </section>

        {/* Warning Indicator */}
        <WarningIndicator active={wallWarning} />

        {/* Control Panel */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Directional Controls */}
          <div className="bg-card p-6 rounded-lg border border-border">
            <h2 className="text-lg font-semibold mb-4">Movement</h2>
            <div className="grid grid-cols-3 gap-2 w-fit mx-auto">
              <div className="col-start-2">
                <ControlButton
                  icon={ArrowUp}
                  onClick={() => handleDirection("forward")}
                  active={activeDirection === "forward"}
                  label="Move forward"
                />
              </div>
              <ControlButton
                icon={ArrowLeft}
                onClick={() => handleDirection("left")}
                active={activeDirection === "left"}
                label="Turn left"
              />
              <div />
              <ControlButton
                icon={ArrowRight}
                onClick={() => handleDirection("right")}
                active={activeDirection === "right"}
                label="Turn right"
              />
              <div className="col-start-2">
                <ControlButton
                  icon={ArrowDown}
                  onClick={() => handleDirection("backward")}
                  active={activeDirection === "backward"}
                  label="Move backward"
                />
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="space-y-4">
            <div className="bg-card p-6 rounded-lg border border-border">
              <h2 className="text-lg font-semibold mb-4">Actions</h2>
              <Button
                onClick={toggleSuction}
                size="lg"
                className="w-full h-16 text-lg"
                variant={suctionActive ? "default" : "outline"}
              >
                <Power className="h-6 w-6 mr-2" />
                {suctionActive ? "Stop Suction" : "Start Suction"}
              </Button>
            </div>

            <SpeedControl speed={speed} onChange={setSpeed} />
          </div>
        </div>

        {/* Debug Controls */}
        <div className="flex justify-center">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={simulateWallDetection}
          >
            Simulate Wall Detection (Testing)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;

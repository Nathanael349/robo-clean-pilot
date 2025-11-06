import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Power } from "lucide-react";
import CameraFeed from "@/components/CameraFeed";
import ControlButton from "@/components/ControlButton";
import WarningIndicator from "@/components/WarningIndicator";
import SpeedControl from "@/components/SpeedControl";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { serial, type SerialStatus } from "@/lib/serial";

const Index = () => {
  const [activeDirection, setActiveDirection] = useState<string | null>(null);
  const [suctionActive, setSuctionActive] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [wallWarning, setWallWarning] = useState(false);
  const { toast } = useToast();
  const [serialStatus, setSerialStatus] = useState<SerialStatus>("disconnected");

  useEffect(() => {
    const unsub = serial.onStatusChange(setSerialStatus);
    return () => unsub();
  }, []);

  // Optional: WASD keyboard shortcuts mirror the buttons
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "w") handleDirection("forward");
      else if (k === "a") handleDirection("left");
      else if (k === "s") handleDirection("backward");
      else if (k === "d") handleDirection("right");
      else if (k === "p") handleStop();
      else if (k === "i") handleSuction(true);
      else if (k === "o") handleSuction(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [speed, serialStatus]);

  const handleDirection = (direction: string) => {
    setActiveDirection(direction);
    toast({
      title: `Moving ${direction}`,
      description: `Speed: ${speed}%`,
    });
    // Map direction to Arduino command characters: w/a/s/d
    const map: Record<string, string> = {
      forward: "w",
      left: "a",
      backward: "s",
      right: "d",
    };
    const cmd = map[direction];
    if (cmd) {
      if (serialStatus === "connected") {
        serial
          .send(cmd)
          .catch((err) => console.error("Serial send failed:", err));
      } else {
        console.warn("Serial not connected; command not sent");
      }
    }
    // For visibility in dev tools
    console.log(`Command: ${direction} -> ${cmd ?? "?"}, Speed: ${speed}`);
    
    // Reset active state after a short delay
    setTimeout(() => setActiveDirection(null), 200);
  };

  const handleSuction = (start: boolean) => {
    setSuctionActive(start);
    toast({ title: start ? "Suction started" : "Suction stopped" });
    const cmd = start ? "i" : "o";
    if (serialStatus === "connected") {
      serial
        .send(cmd)
        .catch((err) => console.error("Serial send failed:", err));
    } else {
      console.warn("Serial not connected; suction command not sent");
    }
    console.log(`Command: suction -> ${cmd}`);
  };

  const toggleSuction = () => {
    handleSuction(!suctionActive);
  };

  const handleStop = () => {
    setActiveDirection(null);
    toast({ title: "Stop", description: "Motors halted" });
    if (serialStatus === "connected") {
      serial
        .send("p")
        .catch((err) => console.error("Serial send failed:", err));
    } else {
      console.warn("Serial not connected; stop not sent");
    }
    console.log("Command: stop -> p");
  };

  // Simulate sensor data (replace with actual Flask API call)
  const simulateWallDetection = () => {
    setWallWarning(!wallWarning);
  };

  // Camera feed from Flask/Python (camera_control.py)
  // Override via VITE_CAMERA_FEED_URL if your server runs elsewhere
  const cameraFeedUrl = (import.meta as any).env?.VITE_CAMERA_FEED_URL ?? "http://localhost:5000/video_feed";

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
            VACUUM ROBOT CONTROL
          </h1>
          <p className="text-sm text-muted-foreground uppercase tracking-wider">Neural Interface v2.0</p>
        </header>

        {/* Camera Feed */}
        <section>
          <CameraFeed videoSrc={cameraFeedUrl} />
        </section>

        {/* Serial Connection */}
        <div className="bg-card p-4 rounded-lg border-2 border-border flex items-center justify-between gap-3">
          <div className="text-sm">
            <div className="font-semibold">Arduino Connection</div>
            <div className="text-muted-foreground">
              {serial.supported
                ? serialStatus === "connected"
                  ? "Connected"
                  : serialStatus === "connecting"
                    ? "Connecting..."
                    : "Disconnected"
                : "Web Serial not supported in this browser"}
            </div>
          </div>
          <div className="flex gap-2">
            {serial.supported && serialStatus !== "connected" && (
              <Button
                onClick={async () => {
                  try {
                    await serial.requestPort();
                    await serial.connect({ baudRate: 9600 });
                    toast({ title: "Serial connected", description: "Ready to send commands" });
                  } catch (err: any) {
                    toast({ title: "Serial error", description: err?.message ?? String(err), variant: "destructive" });
                  }
                }}
                size="sm"
              >
                Connect
              </Button>
            )}
            {serial.supported && serialStatus === "connected" && (
              <Button
                onClick={async () => {
                  await serial.disconnect();
                  toast({ title: "Serial disconnected" });
                }}
                size="sm"
                variant="secondary"
              >
                Disconnect
              </Button>
            )}
          </div>
        </div>

        {/* Warning Indicator */}
        <WarningIndicator active={wallWarning} />

        {/* Control Panel */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Directional Controls */}
          <div className="bg-card p-6 rounded-lg border-2 border-border shadow-[0_0_15px_rgba(0,255,255,0.15)]">
            <h2 className="text-lg font-semibold mb-4 text-primary uppercase tracking-wide">Movement</h2>
            <div className="relative w-fit mx-auto">
              <div className="grid grid-cols-3 gap-0 w-fit">
                {/* Top row - Up button */}
                <div />
                <ControlButton
                  icon={ArrowUp}
                  onClick={() => handleDirection("forward")}
                  active={activeDirection === "forward"}
                  label="Move forward"
                />
                <div />
                
                {/* Middle row - Left, Center, Right */}
                <ControlButton
                  icon={ArrowLeft}
                  onClick={() => handleDirection("left")}
                  active={activeDirection === "left"}
                  label="Turn left"
                />
                <div className="h-16 w-16 rounded-full bg-control-bg border-2 border-border" />
                <ControlButton
                  icon={ArrowRight}
                  onClick={() => handleDirection("right")}
                  active={activeDirection === "right"}
                  label="Turn right"
                />
                
                {/* Bottom row - Down button */}
                <div />
                <ControlButton
                  icon={ArrowDown}
                  onClick={() => handleDirection("backward")}
                  active={activeDirection === "backward"}
                  label="Move backward"
                />
                <div />
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="space-y-4">
            <div className="bg-card p-6 rounded-lg border-2 border-border shadow-[0_0_15px_rgba(0,255,255,0.15)]">
              <h2 className="text-lg font-semibold mb-4 text-primary uppercase tracking-wide">Actions</h2>
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

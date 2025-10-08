import { Video } from "lucide-react";

interface CameraFeedProps {
  videoSrc?: string;
}

const CameraFeed = ({ videoSrc }: CameraFeedProps) => {
  return (
    <div className="relative w-full aspect-video bg-camera-bg rounded-lg overflow-hidden border-2 border-border">
      {videoSrc ? (
        <img 
          src={videoSrc} 
          alt="Robot camera feed" 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <Video className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-sm">Camera feed will appear here</p>
          <p className="text-xs mt-2 opacity-70">Connect to Flask backend</p>
        </div>
      )}
    </div>
  );
};

export default CameraFeed;

import React, { useEffect, useRef } from "react";

interface VideoPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
  label?: string;
  isLocal?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  stream, 
  muted = false, 
  label = "Unknown",
  isLocal = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      console.log(`Setting video stream for: ${label}`, stream.id);
      console.log(`Video tracks: ${stream.getVideoTracks().length}`);
      console.log(`Audio tracks: ${stream.getAudioTracks().length}`);
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.log("Autoplay prevented:", err);
      });
    }
  }, [stream, label]);

  const hasVideo = stream?.getVideoTracks().some(track => track.enabled);
  const hasAudio = stream?.getAudioTracks().some(track => track.enabled);

  return (
    <div className="group relative w-full aspect-video bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-purple-500/20 hover:shadow-2xl hover:scale-[1.02]">
      {stream && hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 via-purple-900/30 to-slate-900 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          </div>

          
          <div className="relative text-center z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-full flex items-center justify-center text-4xl font-bold mb-4 mx-auto shadow-2xl animate-pulse border-4 border-white/20">
              {label?.charAt(0).toUpperCase() || "?"}
            </div>
            <p className="text-white font-semibold text-lg mb-1">{label}</p>
            <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              Camera Off
            </p>
          </div>
        </div>
      )}
      
     
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
           
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white/30">
              {label?.charAt(0).toUpperCase() || "?"}
            </div>
            
      
            <div>
              <p className="text-white font-semibold text-base drop-shadow-lg flex items-center gap-2">
                {label}
                {isLocal && (
                  <span className="text-xs bg-gradient-to-r from-purple-500 to-blue-500 px-2 py-0.5 rounded-full font-medium">
                    You
                  </span>
                )}
              </p>
            </div>
          </div>
          
      
          <div className="flex items-center gap-2">
            {!hasAudio && (
              <div className="bg-red-500/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                <span className="text-white text-xs">🔇</span>
              </div>
            )}
            {!hasVideo && (
              <div className="bg-red-500/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                <span className="text-white text-xs">📷</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs text-white font-medium">Live</span>
      </div>
    </div>
  );
};

export default VideoPlayer;
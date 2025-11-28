import React from "react";
import { useCallContext } from "../../../webrtcutilites/callcontext";

const Controls: React.FC = () => {
  const {
    localStream,
    callStatus,
    updateCallStatus,
    endCall,
    isScreenSharing,
    setIsScreenSharing,
    screenStream,
    setScreenStream,
    peerConnections,
  } = useCallContext();

  const toggleAudio = () => {
    if (!localStream) {
      console.log("❌ No local stream available");
      return;
    }

    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) {
      console.log("❌ No audio tracks found");
      return;
    }

    const audioTrack = audioTracks[0];
    audioTrack.enabled = !audioTrack.enabled;

    console.log("🎤 Audio toggled:", audioTrack.enabled);

    updateCallStatus({
      audioEnabled: audioTrack.enabled
    });
  };

  const toggleVideo = () => {
    if (!localStream) {
      console.log("❌ No local stream available");
      return;
    }

    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length === 0) {
      console.log("❌ No video tracks found");
      return;
    }

    const videoTrack = videoTracks[0];
    videoTrack.enabled = !videoTrack.enabled;

    console.log("📹 Video toggled:", videoTrack.enabled);

    updateCallStatus({
      videoEnabled: videoTrack.enabled
    });
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        console.log("🖥️ Starting screen share...");
        
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always",
          },
          audio: false,
        });
        setScreenStream(stream);
        setIsScreenSharing(true);
        const screenTrack = stream.getVideoTracks()[0];
        
        Object.values(peerConnections).forEach((pc) => {
          const senders = pc.getSenders();
          const videoSender = senders.find(sender => sender.track?.kind === "video");
          
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
            console.log("✅ Replaced video track with screen share");
          }
        });
        screenTrack.onended = () => {
          console.log("🛑 Screen share stopped by user");
          stopScreenShare();
        };

        console.log("✅ Screen sharing started");
      } else {
        stopScreenShare();
      }
    } catch (error) {
      console.error("❌ Screen share error:", error);
      alert("Could not share screen. Make sure you granted permission!");
    }
  };

  const stopScreenShare = () => {
    console.log("🛑 Stopping screen share...");
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    if (localStream) {
      const cameraTrack = localStream.getVideoTracks()[0];
      
      Object.values(peerConnections).forEach((pc) => {
        const senders = pc.getSenders();
        const videoSender = senders.find(sender => sender.track?.kind === "video");
        
        if (videoSender && cameraTrack) {
          videoSender.replaceTrack(cameraTrack);
          console.log("✅ Replaced screen share with camera");
        }
      });
    }

    setIsScreenSharing(false);
    console.log("✅ Screen sharing stopped");
  };

  return (
    <div className="flex items-center justify-center gap-4 max-w-3xl mx-auto">
      <button
        onClick={toggleAudio}
        className={`relative group px-6 py-4 rounded-2xl font-semibold shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center gap-3 ${
          callStatus.audioEnabled 
            ? "bg-slate-700 hover:bg-slate-600 text-white border-2 border-slate-500" 
            : "bg-red-600 hover:bg-red-700 text-white border-2 border-red-500 animate-pulse"
        }`}
        title={callStatus.audioEnabled ? "Mute microphone" : "Unmute microphone"}
      >
        <span className="text-2xl">
          {callStatus.audioEnabled ? "🎤" : "🔇"}
        </span>
        <span className="text-sm font-bold hidden sm:inline">
          {callStatus.audioEnabled ? "Mute" : "Unmute"}
        </span>
        <div className={`absolute inset-0 rounded-2xl blur-xl opacity-50 ${
          callStatus.audioEnabled ? "bg-slate-500" : "bg-red-500"
        } -z-10 group-hover:opacity-75 transition-opacity`}></div>
      </button>
      <button
        onClick={toggleVideo}
        className={`relative group px-6 py-4 rounded-2xl font-semibold shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center gap-3 ${
          callStatus.videoEnabled 
            ? "bg-slate-700 hover:bg-slate-600 text-white border-2 border-slate-500" 
            : "bg-red-600 hover:bg-red-700 text-white border-2 border-red-500 animate-pulse"
        }`}
        title={callStatus.videoEnabled ? "Turn off camera" : "Turn on camera"}
      >
        <span className="text-2xl">
          {callStatus.videoEnabled ? "📹" : "📷"}
        </span>
        <span className="text-sm font-bold hidden sm:inline">
          {callStatus.videoEnabled ? "Stop Video" : "Start Video"}
        </span>
        <div className={`absolute inset-0 rounded-2xl blur-xl opacity-50 ${
          callStatus.videoEnabled ? "bg-slate-500" : "bg-red-500"
        } -z-10 group-hover:opacity-75 transition-opacity`}></div>
      </button>
      <button
        onClick={toggleScreenShare}
        className={`relative group px-6 py-4 rounded-2xl font-semibold shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center gap-3 ${
          isScreenSharing
            ? "bg-green-600 hover:bg-green-700 text-white border-2 border-green-500"
            : "bg-slate-700 hover:bg-slate-600 text-white border-2 border-slate-500"
        }`}
        title={isScreenSharing ? "Stop sharing screen" : "Share screen"}
      >
        <span className="text-2xl">🖥️</span>
        <span className="text-sm font-bold hidden sm:inline">
          {isScreenSharing ? "Stop Share" : "Share Screen"}
        </span>
        <div className={`absolute inset-0 rounded-2xl blur-xl opacity-50 ${
          isScreenSharing ? "bg-green-500" : "bg-slate-500"
        } -z-10 group-hover:opacity-75 transition-opacity`}></div>
      </button>
      <button
        onClick={endCall}
        className="relative group px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center gap-3 border-2 border-red-500"
        title="Leave call"
      >
        <span className="text-2xl">📞</span>
        <span className="text-sm font-bold hidden sm:inline">Leave</span>
        <div className="absolute inset-0 rounded-2xl bg-red-500 blur-xl opacity-50 -z-10 group-hover:opacity-75 transition-opacity"></div>
      </button>
    </div>
  );
};

export default Controls;
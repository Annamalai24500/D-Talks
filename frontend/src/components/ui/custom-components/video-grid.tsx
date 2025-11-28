import VideoPlayer from "./video-player";

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStreams: { [socketId: string]: MediaStream };
}

const VideoGrid: React.FC<VideoGridProps> = ({ localStream, remoteStreams }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 w-full max-w-7xl mx-auto">
      {localStream && (
        <VideoPlayer
          stream={localStream}
          muted={true}
          label="You"
          isLocal={true}
        />
      )}
      {Object.entries(remoteStreams).map(([peerId, stream]) => {
        const trackCount = stream.getTracks().length;
        console.log(`Rendering video for ${peerId}, tracks: ${trackCount}`);
        
        return (
          <VideoPlayer
            key={`${peerId}-${trackCount}`}
            stream={stream}
            muted={false}
            label={`User ${peerId.slice(0, 6)}`}
            isLocal={false}
          />
        );
      })}
      {Object.keys(remoteStreams).length === 0 && (
        <div className="col-span-1 md:col-span-2 flex items-center justify-center h-64">
          <div className="text-center text-gray-400">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-lg">Waiting for others to join...</p>
            <p className="text-sm mt-2">Share the room link to invite people</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoGrid;
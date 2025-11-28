const prepForCall = async (
    callStatus: any,
    updateCallStatus: any,
    setLocalStream: any
): Promise<MediaStream> => {
    console.log("🎥 prepForCall: Starting...");
    
    const constraints = {
        video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
        },
        audio: true
    };

    try {
        console.log("📹 Requesting getUserMedia...");
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        console.log("✅ Got media stream:", stream);
        console.log("📹 Video tracks:", stream.getVideoTracks().length);
        console.log("🎤 Audio tracks:", stream.getAudioTracks().length);
        const newStatus = {
            ...callStatus,
            haveMedia: true,
            videoEnabled: true,
            audioEnabled: true,
        };
        updateCallStatus(newStatus);
        console.log("💾 Setting local stream...");
        setLocalStream(stream);
        console.log("✅ prepForCall: Complete!");
        return stream;
    } catch (err) {
        console.error("❌ prepForCall error:", err);
        alert("Could not access camera/microphone. Please allow permissions!");
        throw err;
    }
};

export default prepForCall;
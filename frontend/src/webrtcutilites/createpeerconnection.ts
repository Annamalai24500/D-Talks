import { Socket } from "socket.io-client";
import peerConfiguration from "./STUNandTURN-SERVER";

const createPeerConnection = (
    socketId: string,
    roomId: string,
    socket: Socket,
    onTrackReceived?: (socketId: string, stream: MediaStream) => void
) => {
    try {
        console.log(` Creating peer connection for: ${socketId}`);
        const peerConnection = new RTCPeerConnection(peerConfiguration);
        const remoteStream = new MediaStream();
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log(`Sending ICE candidate to: ${socketId}`);
                socket.emit("iceCandidate", {
                    roomId,
                    candidate: event.candidate,
                    to: socketId,
                });
            }
        };
        peerConnection.ontrack = (event) => {
            console.log(`Received remote track from: ${socketId}`, event.track.kind);
            const [incomingStream] = event.streams;
            incomingStream.getTracks().forEach((track) => {
                if (!remoteStream.getTracks().find(t => t.id === track.id)) {
                    remoteStream.addTrack(track);
                    console.log(` Added ${track.kind} track from ${socketId}`);
                }
            });
            if (onTrackReceived) {
                console.log(` Triggering stream update for ${socketId}`);
                onTrackReceived(socketId, remoteStream);
            }
        };
        peerConnection.onconnectionstatechange = () => {
            const state = peerConnection.connectionState;
            console.log(` Connection state with ${socketId}:`, state);
            
            if (state === "connected") {
                console.log(` Successfully connected to ${socketId}`);
            } else if (state === "disconnected" || state === "failed") {
                console.log(` Connection lost with ${socketId}`);
            }
        };
        peerConnection.oniceconnectionstatechange = () => {
            console.log(` ICE state with ${socketId}:`, peerConnection.iceConnectionState);
        };

        return { peerConnection, remoteStream };
    } catch (error) {
        console.error(" createPeerConnection ERROR:", error);
        throw error;
    }
};

export default createPeerConnection;
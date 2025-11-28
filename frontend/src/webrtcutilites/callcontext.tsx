import React, { createContext, useContext, useState } from "react";
import { Socket } from "socket.io-client";
import { useNavigate } from "react-router-dom";

interface CallStatus {
    haveMedia: boolean;
    videoEnabled: boolean;
    audioEnabled: boolean;
}
interface CallContextType {
    socket: Socket | null;
    setSocket: (s: Socket | null) => void;

    peerConnections: { [socketId: string]: RTCPeerConnection };
    setPeerConnections: React.Dispatch<React.SetStateAction<{ [socketId: string]: RTCPeerConnection }>>;

    localStream: MediaStream | null;
    setLocalStream: (s: MediaStream | null) => void;

    remoteStreams: { [socketId: string]: MediaStream };
    setRemoteStreams: React.Dispatch<React.SetStateAction<{ [socketId: string]: MediaStream }>>;

    callStatus: CallStatus;
    updateCallStatus: (obj: Partial<CallStatus>) => void;

    endCall: () => void;
    isScreenSharing: boolean;
    setIsScreenSharing: (val: boolean) => void;
    screenStream: MediaStream | null;
    setScreenStream: (s: MediaStream | null) => void;
}
const defaultValue: CallContextType = {
    socket: null,
    setSocket: () => {},

    peerConnections: {},
    setPeerConnections: () => {},

    localStream: null,
    setLocalStream: () => {},

    remoteStreams: {},
    setRemoteStreams: () => {},

    callStatus: {
        haveMedia: false,
        videoEnabled: true,
        audioEnabled: false,
    },
    updateCallStatus: () => {},
    endCall: () => {},
    
    isScreenSharing: false,
    setIsScreenSharing: () => {},
    screenStream: null,
    setScreenStream: () => {},
};
const CallContext = createContext<CallContextType>(defaultValue);
export const CallProvider = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();
    
    const [socket, setSocket] = useState<Socket | null>(null);
    
    const [peerConnections, setPeerConnections] = useState<{ [socketId: string]: RTCPeerConnection }>({});
    const [remoteStreams, setRemoteStreams] = useState<{ [socketId: string]: MediaStream }>({});

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);

    const [callStatus, setCallStatus] = useState<CallStatus>({
        haveMedia: false,
        videoEnabled: true,
        audioEnabled: false,
    });
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

    const updateCallStatus = (obj: Partial<CallStatus>) => {
        setCallStatus((prev) => ({ ...prev, ...obj }));
    };
    const endCall = () => {
        console.log("🔴 Ending call and cleaning up...");
        if (localStream) {
            localStream.getTracks().forEach(track => {
                track.stop();
                console.log("🛑 Stopped track:", track.kind);
            });
        }
        if (screenStream) {
            screenStream.getTracks().forEach(track => {
                track.stop();
                console.log("🛑 Stopped screen share track");
            });
        }
        Object.entries(peerConnections).forEach(([id, pc]) => {
            pc.close();
            console.log("🔌 Closed connection with:", id);
        });
        if (socket) {
            socket.disconnect();
            console.log("🔌 Socket disconnected");
        }
        setLocalStream(null);
        setPeerConnections({});
        setRemoteStreams({});
        setSocket(null);
        setIsScreenSharing(false);
        setScreenStream(null);
        navigate("/");
    };

    return (
        <CallContext.Provider
            value={{
                socket,
                setSocket,

                peerConnections,
                setPeerConnections,

                localStream,
                setLocalStream,

                remoteStreams,
                setRemoteStreams,

                callStatus,
                updateCallStatus,

                endCall,

                isScreenSharing,
                setIsScreenSharing,
                screenStream,
                setScreenStream,
            }}
        >
            {children}
        </CallContext.Provider>
    );
};
export const useCallContext = () => useContext(CallContext);
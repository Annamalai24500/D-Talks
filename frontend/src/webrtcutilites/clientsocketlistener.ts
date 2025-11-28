import { Socket } from "socket.io-client";

interface CallStatus {
    haveMedia: boolean;
    videoEnabled: boolean | null;
    audioEnabled: boolean;
    myRole: "offer" | "answer" | null;
    offer: any;
    answer: any;
}

const clientSocketListeners = (
    socket: Socket,
    typeOfCall: "offer" | "answer",
    callStatus: CallStatus,
    updateCallStatus: (s: CallStatus) => void,
    peerConnection: RTCPeerConnection,
    setRemoteUser: (userId: string | null) => void,
    localStream: MediaStream | null
) => {
    socket.on("userJoined", ({ socketId, username }) => {
        console.log("User joined:", socketId);
        setRemoteUser(socketId);
    });
    socket.on("existingUsers", (users) => {
        console.log("Users already inside room:", users);
        if (users.length > 0) {
            setRemoteUser(users[0]);
        }
    });
    socket.on("answerResponse", (offerObj) => {
        console.log("Received final answer:", offerObj);

        const copy = { ...callStatus };
        copy.answer = offerObj.answer;
        copy.myRole = typeOfCall;
        updateCallStatus(copy);
    });
    socket.on("receivedIceCandidateFromServer", async (candidate) => {
        try {
            if (candidate && peerConnection.remoteDescription) {
                await peerConnection.addIceCandidate(candidate);
                console.log(" Added remote ICE candidate:", candidate);
            }
        } catch (err) {
            console.log(" ICE add error:", err);
        }
    });
    socket.on("offer", async (data) => {
        console.log(" Received offer from:", data.from);
    });
    socket.on("answer", async (data) => {
        console.log("Received answer from:", data.from);
    });
    socket.on("userLeft", ({ socketId }) => {
        console.log(" User left:", socketId);
        setRemoteUser(null);
    });
    socket.on("error", (error) => {
        console.error(" Socket error:", error);
    });
    console.log("Client socket listeners initialized!");
};

export default clientSocketListeners;
import React, { useEffect, useState, useRef } from "react";
import { useParams,useNavigate } from "react-router-dom";
import { useCallContext } from "../webrtcutilites/callcontext";
import socketConnection from "../webrtcutilites/socket-connection";
import prepForCall from "../webrtcutilites/prepforcall";
import createPeerConnection from "../webrtcutilites/createpeerconnection";
import VideoGrid from "../components/ui/custom-components/video-grid";
import Controls from "../components/ui/custom-components/controls";
import axios from "axios";

type RTCSessionDescriptionInit = globalThis.RTCSessionDescriptionInit;
type RTCIceCandidateInit = globalThis.RTCIceCandidateInit;

const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [isInitialized, setIsInitialized] = useState(false);
  const [mySocketId, setMySocketId] = useState<string>("");
  const [, forceUpdate] = useState(0);

  const {
    socket,
    setSocket,
    localStream,
    setLocalStream,
    peerConnections,
    setPeerConnections,
    remoteStreams,
    setRemoteStreams,
    callStatus,
    updateCallStatus,
  } = useCallContext();

  const peerConnectionsRef = useRef(peerConnections);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<any>(null);
  const pendingIceCandidates = useRef<{ [socketId: string]: RTCIceCandidateInit[] }>({});
  const navigate = useNavigate();
  useEffect(() => {
    peerConnectionsRef.current = peerConnections;
  }, [peerConnections]);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);
  const shouldCreateOffer = (remoteSocketId: string, currentSocketId?: string): boolean => {
    const myId = currentSocketId || mySocketId;
    if (!myId || !remoteSocketId) {
      console.log("⚠️ Missing socket IDs - myId:", myId, "remoteId:", remoteSocketId);
      return false;
    }
    const result = myId.localeCompare(remoteSocketId) < 0;
    console.log(`🎲 Comparing "${myId}" vs "${remoteSocketId}" = ${result ? 'I CREATE OFFER' : 'I WAIT'}`);
    return result;
  };

  const validroom = async() =>{
    try {
      const response = await axios.get(`http://localhost:8080/api/room/validroom/${roomId}`);
      if(response.data.success){
        console.log("Valid roombuddy");
        return;
      }else{
        console.log("Not a valid room");
        navigate("/")
        return;
      }
    } catch (error) {
      console.log(error)
    }
  }
  const handleRemoteTrack = (socketId: string, stream: MediaStream) => {
    console.log("🎬 Updating remote stream for:", socketId);
    console.log("📊 Stream has tracks:", stream.getTracks().length);
    stream.getTracks().forEach(track => {
      console.log(`  - ${track.kind} track:`, track.id, "enabled:", track.enabled);
    });
    
    setRemoteStreams(prev => {
      const updated = { ...prev, [socketId]: stream };
      console.log("📊 Total remote streams:", Object.keys(updated).length);
      return updated;
    });
    

    forceUpdate(prev => prev + 1);
  };

  const createOfferToUser = async (remoteSocketId: string, forceCreate: boolean = false) => {
    const sock = socketRef.current;
    const myId = sock?.id;

    console.log("🎯 createOfferToUser called for:", remoteSocketId);
    console.log("   My ID:", myId, "| Force:", forceCreate);

    if (!forceCreate) {
      console.log("❌ Not forcing, checking shouldCreateOffer...");
      if (!shouldCreateOffer(remoteSocketId, myId)) {
        console.log("⏸️ Skipping - should wait for offer from:", remoteSocketId);
        return;
      }
    }

    if (peerConnectionsRef.current[remoteSocketId]) {
      console.log("⚠️ Connection already exists for:", remoteSocketId);
      return;
    }

    if (!localStreamRef.current) {
      console.log("❌ No local stream!");
      return;
    }

    if (!sock) {
      console.log("❌ No socket!");
      return;
    }

    try {
      console.log("🚀 Creating peer connection and offer for:", remoteSocketId);
      
      const { peerConnection, remoteStream } = createPeerConnection(
        remoteSocketId, 
        roomId!, 
        sock,
        handleRemoteTrack
      );
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
        console.log("📤 Added track:", track.kind);
      });
      setRemoteStreams(prev => ({ ...prev, [remoteSocketId]: remoteStream }));
      setPeerConnections(prev => ({ ...prev, [remoteSocketId]: peerConnection }));
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      console.log("📤 Sending offer to:", remoteSocketId);
      sock.emit("newOffer", {
        roomId,
        offer,
        offerTo: remoteSocketId
      });

    } catch (error) {
      console.error("❌ Error creating offer:", error);
    }
  };
  const handleOffer = async (from: string, offer: RTCSessionDescriptionInit) => {
    try {
      console.log("📞 Handling offer from:", from);
      
      const sock = socketRef.current;
      const myId = sock?.id;
      if (myId && shouldCreateOffer(from, myId)) {
        console.log("❌ Rejecting offer - I should be the offerer, not them");
        return;
      }

      if (peerConnectionsRef.current[from]) {
        console.log("⚠️ Connection already exists");
        return;
      }

      if (!localStreamRef.current) {
        console.log("❌ No local stream!");
        return;
      }

      if (!sock) return;

      console.log("✅ Accepting offer and creating answer");

      const { peerConnection, remoteStream } = createPeerConnection(
        from, 
        roomId!, 
        sock,
        handleRemoteTrack
      );
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
        console.log("📤 Added track:", track.kind);
      });
      setRemoteStreams(prev => ({ ...prev, [from]: remoteStream }));
      setPeerConnections(prev => ({ ...prev, [from]: peerConnection }));
      await peerConnection.setRemoteDescription(offer);
      if (pendingIceCandidates.current[from]) {
        console.log(`📦 Processing ${pendingIceCandidates.current[from].length} pending ICE candidates`);
        for (const candidate of pendingIceCandidates.current[from]) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error("❌ Error adding pending ICE:", err);
          }
        }
        delete pendingIceCandidates.current[from];
      }
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      console.log("📤 Sending answer to:", from);
      sock.emit("newAnswer", {
        roomId,
        answer,
        answerTo: from
      });

    } catch (error) {
      console.error("❌ Error handling offer:", error);
    }
  };

  const handleAnswer = async (from: string, answer: RTCSessionDescriptionInit) => {
    try {
      console.log("✅ Handling answer from:", from);

      const peerConnection = peerConnectionsRef.current[from];
      if (!peerConnection) {
        console.log("❌ No peer connection for:", from);
        return;
      }

      await peerConnection.setRemoteDescription(answer);
      console.log("✅ Remote description set");

      
      if (pendingIceCandidates.current[from]) {
        console.log(`📦 Processing ${pendingIceCandidates.current[from].length} pending ICE candidates`);
        for (const candidate of pendingIceCandidates.current[from]) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error("❌ Error adding pending ICE:", err);
          }
        }
        delete pendingIceCandidates.current[from];
      }

    } catch (error) {
      console.error("❌ Error handling answer:", error);
    }
  };

  
  const handleIceCandidate = async (from: string, candidate: RTCIceCandidateInit) => {
    try {
      const peerConnection = peerConnectionsRef.current[from];
      
      if (!peerConnection) {
        console.log("⚠️ No peer connection yet, buffering ICE from:", from);
        if (!pendingIceCandidates.current[from]) {
          pendingIceCandidates.current[from] = [];
        }
        pendingIceCandidates.current[from].push(candidate);
        return;
      }
      if (!peerConnection.remoteDescription) {
        console.log("⚠️ Remote description not set yet, buffering ICE from:", from);
        if (!pendingIceCandidates.current[from]) {
          pendingIceCandidates.current[from] = [];
        }
        pendingIceCandidates.current[from].push(candidate);
        return;
      }

      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log("✅ ICE candidate added from:", from);

    } catch (error) {
      console.error("❌ ICE error:", error);
    }
  };

  const setupSocketListeners = (sock: any) => {
    console.log("🔧 Setting up socket listeners...");
    sock.off("existingUsers");
    sock.off("userJoined");
    sock.off("userLeft");
    sock.off("receiveOffer");
    sock.off("receiveAnswer");
    sock.off("receiveIceCandidate");
    sock.on("existingUsers", (users: Array<{ socketId: string; username: string }>) => {
      console.log("📋 Existing users:", users);

      if (users.length === 0) {
        console.log("👤 I'm the first person here!");
        return;
      }
      users.forEach(user => {
        console.log("🎯 Existing user:", user.socketId);
        console.log("🔍 My ID:", sock.id, "Their ID:", user.socketId);
        
        setTimeout(() => {
          const myId = sock.id;
          if (!myId) {
            console.log("❌ No socket ID available yet!");
            return;
          }
          
          const shouldCreate = myId.localeCompare(user.socketId) < 0;
          console.log(`🎲 Comparing "${myId}" vs "${user.socketId}" = ${shouldCreate ? 'I CREATE' : 'I WAIT'}`);
          
          if (shouldCreate) {
            console.log("✅ I'm creating offer to:", user.socketId);
            createOfferToUser(user.socketId, true);
          } else {
            console.log("⏸️ Waiting for offer from:", user.socketId);
          }
        }, 1000);
      });
    });
    sock.on("userJoined", (data: { socketId: string; username: string }) => {
      console.log("✅ User joined:", data.socketId, data.username);
      console.log("🔍 My ID:", sock.id, "Their ID:", data.socketId);
      
      setTimeout(() => {
        const myId = sock.id;
        if (!myId) {
          console.log("❌ No socket ID available yet!");
          return;
        }
        
        const shouldCreate = myId.localeCompare(data.socketId) < 0;
        console.log(`🎲 Comparing "${myId}" vs "${data.socketId}" = ${shouldCreate ? 'I CREATE' : 'I WAIT'}`);
        
        if (shouldCreate) {
          console.log("✅ I'm creating offer to:", data.socketId);
          createOfferToUser(data.socketId, true);
        } else {
          console.log("⏸️ Waiting for offer from:", data.socketId);
        }
      }, 1000);
    });
    sock.on("userLeft", (data: { socketId: string }) => {
      console.log("👋 User left:", data.socketId);
      delete pendingIceCandidates.current[data.socketId];
      setPeerConnections(prev => {
        const pc = prev[data.socketId];
        if (pc) {
          pc.close();
          console.log("🔌 Closed connection");
        }
        const newPcs = { ...prev };
        delete newPcs[data.socketId];
        return newPcs;
      });
      setRemoteStreams(prev => {
        const newStreams = { ...prev };
        delete newStreams[data.socketId];
        return newStreams;
      });
    });
    sock.on("receiveOffer", async (data: { from: string; offer: RTCSessionDescriptionInit; username: string }) => {
      console.log("📞 Received offer from:", data.from, data.username);
      await handleOffer(data.from, data.offer);
    });
    sock.on("receiveAnswer", async (data: { from: string; answer: RTCSessionDescriptionInit; username: string }) => {
      console.log("✅ Received answer from:", data.from, data.username);
      await handleAnswer(data.from, data.answer);
    });
    sock.on("receiveIceCandidate", async (data: { from: string; candidate: RTCIceCandidateInit }) => {
      console.log("🧊 Received ICE from:", data.from);
      await handleIceCandidate(data.from, data.candidate);
    });

    console.log("✅ Socket listeners ready!");
  };
  useEffect(() => {
    if (!roomId || isInitialized) return;
    validroom()
    const initializeRoom = async () => {
      console.log("🚀 Initializing room:", roomId);

      try {
        console.log("📹 Getting media...");
        const stream = await prepForCall(callStatus, updateCallStatus, setLocalStream);
        localStreamRef.current = stream;
        console.log("✅ Media ready!");
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log("🔌 Connecting socket...");
        const sock = socketConnection();
        socketRef.current = sock;
        setSocket(sock);
        sock.on("connect", () => {
          const socketId = sock.id;
          console.log("✅ Socket connected:", socketId);
          setMySocketId(socketId);
          setupSocketListeners(sock);
          console.log("📥 Joining room...");
          sock.emit("joinRoom", roomId);
        });
        setIsInitialized(true);
      } catch (error) {
        console.error("❌ Initialization failed:", error);
        alert("Failed to initialize. Check camera/mic permissions!");
      }
    };
    initializeRoom();
    return () => {
      console.log("🧹 Cleanup...");
      if (socketRef.current) {
        socketRef.current.emit("leaveRoom", roomId);
        socketRef.current.disconnect();
      }
    };
  }, [roomId, isInitialized]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🎥</div>
          <div className="text-xl font-semibold">Initializing room...</div>
          <div className="text-sm text-gray-400 mt-2">Getting ready to connect</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="p-4 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              dtalks
            </h1>
            <p className="text-sm text-gray-400">Room: {roomId}</p>
            <p className="text-xs text-gray-500">My ID: {mySocketId.slice(0, 8)}...</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-semibold border border-green-500/30">
              👥 {Object.keys(remoteStreams).length + 1} online
            </span>
          </div>
        </div>
      </div>
      <div className="p-2 bg-black/50 text-xs text-gray-400 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <span>Connections: {Object.keys(peerConnections).length}</span>
          <span className="ml-4">Remote Streams: {Object.keys(remoteStreams).length}</span>
          <span className="ml-4">IDs: {Object.keys(remoteStreams).map(id => id.slice(0,6)).join(', ')}</span>
        </div>
      </div>
      <div className="p-4">
        <VideoGrid localStream={localStream} remoteStreams={remoteStreams} />
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
        <Controls />
      </div>
    </div>
  );
};

export default Room;
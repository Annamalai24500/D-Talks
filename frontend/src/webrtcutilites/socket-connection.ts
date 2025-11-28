import { io, Socket } from 'socket.io-client';

const socketConnection = (token?: string | null): Socket => {
    console.log("🔌 Creating NEW socket connection...");
    const socket = io('http://localhost:8080', {
        auth: {
            token: token || localStorage.getItem("token")
        },
        forceNew: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
        console.log("✅ Socket connected with ID:", socket.id);
    });

    socket.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected. Reason:", reason);
    });

    socket.on("connect_error", (err) => {
        console.error("🔴 Socket connection error:", err.message);
    });

    return socket;
};

export default socketConnection;
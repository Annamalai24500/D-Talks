const express = require('express');
const app = express();
const socketio = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
require('./config');

app.use(cors({ origin: ["https://localhost:5173"], credentials: true }));
app.use(express.json());
app.use('/api/auth', require('./routes/authroutes'));
app.use('/api/room', require('./routes/roomroutes'));

const server = app.listen(8080, () => {
    console.log('Server listening on 8080');
});

const io = require("socket.io")(server, {
    cors: {
        origin: [
            "https://localhost:5173",
            "http://192.168.1.44:5173"
        ],
        methods: ["GET", "POST"]
    }
});

const connectedSockets = new Map();
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Token not provided"));
    try {
        const decoded = jwt.verify(token, process.env.jwt_secret);
        socket.username = decoded.username;
        next();
    } catch (err) {
        next(new Error("Invalid token"));
    }
});
io.on("connection", (socket) => {
    const username = socket.username;
    connectedSockets.set(socket.id, username);
    console.log(`User connected: ${username} (${socket.id})`);
    socket.on("joinRoom", (roomName) => {
        socket.join(roomName);
        console.log(`${username} joined room: ${roomName}`);
        const users = Array.from(io.sockets.adapter.rooms.get(roomName) || []);
        const otherUsers = users
            .filter((id) => id !== socket.id)
            .map(id => ({
                socketId: id,
                username: connectedSockets.get(id) || "Unknown"
            }));
        console.log(`Other users in room: ${otherUsers.length}`);
        socket.emit("existingUsers", otherUsers);
        socket.to(roomName).emit("userJoined", {
            socketId: socket.id,
            username: username
        });
    });
    socket.on("leaveRoom", (roomName) => {
        console.log(`${username} left room: ${roomName}`);
        socket.leave(roomName);

        socket.to(roomName).emit("userLeft", {
            socketId: socket.id,
            username: username
        });
    });
    socket.on("newOffer", ({ roomId, offer, offerTo }) => {
        console.log(`Offer from ${username} to ${offerTo}`);
        io.to(offerTo).emit("receiveOffer", {
            from: socket.id,
            offer: offer,
            username: username
        });
    });
    socket.on("newAnswer", ({ roomId, answer, answerTo }) => {
        console.log(`Answer from ${username} to ${answerTo}`);
        io.to(answerTo).emit("receiveAnswer", {
            from: socket.id,
            answer: answer,
            username: username
        });
    });
    socket.on("iceCandidate", ({ roomId, candidate, to }) => {
        console.log(`ICE candidate from ${username} to ${to}`);
        io.to(to).emit("receiveIceCandidate", {
            from: socket.id,
            candidate: candidate
        });
    });
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${username} (${socket.id})`);
        connectedSockets.delete(socket.id);
        const rooms = Array.from(socket.rooms);
        rooms.forEach(roomName => {
            if (roomName !== socket.id) {
                socket.to(roomName).emit("userLeft", {
                    socketId: socket.id,
                    username: username
                });
            }
        });
    });
});
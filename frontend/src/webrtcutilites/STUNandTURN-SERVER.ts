const peerConfiguration = {
    iceServers: [
        {
            urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302"
            ]
        },
        {
            urls: "turn:numb.viagenie.ca",
            username: "webrtc@live.com",
            credential: "muazkh"
        },
        {
            urls: "turn:192.158.29.39:3478?transport=udp",
            username: "28224511:1379330808",
            credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA="
        }
    ]
};

export default peerConfiguration;

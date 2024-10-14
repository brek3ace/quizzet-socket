const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios");
const app = express();
const dotenv = require("dotenv");
const server = http.createServer(app);
dotenv.config();

const io = require("socket.io")(server, {
    cors: {
        origin: "*", // Thay '*' bằng URL cụ thể nếu có
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {
    console.log("Người dùng kết nối:", socket.id);

    socket.on("sendMessage", async (data) => {
        const { chatRoomId, message, userId, token } = data;
        try {
            // Gọi API từ backend để lưu tin nhắn
            const response = await axios.put(
                `${process.env.MONGO_URI}/chat/${chatRoomId}`,
                { text: message, userId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`, // Thêm token vào header
                    },
                }
            );
            // Nếu lưu thành công, phát lại tin nhắn cho các client khác
            io.to(chatRoomId).emit("message", response.data);
        } catch (error) {
            console.log("Lỗi lưu tin nhắn:", error);
        }
    });

    socket.on("joinRoom", (roomId) => {
        socket.join(roomId);
        console.log(`Người dùng ${socket.id} đã tham gia phòng ${roomId}`);
    });

    socket.on("leaveRoom", (roomId) => {
        socket.leave(roomId);
        console.log(`Người dùng ${socket.id} đã rời khỏi phòng ${roomId}`);
    });
});

server.listen(4000, () => {
    console.log("server running on ports 4000");
});

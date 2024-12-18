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

let onlineUsers = [];

const addNewUser = (userId, socketId) => {
    !onlineUsers.some((user) => user.userId === userId) && onlineUsers.push({ userId, socketId });
};

const removeUser = (socketId) => {
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
    return onlineUsers.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
    socket.on("newUser", (userId) => {
        addNewUser(userId, socket.id);
        io.emit("getOnlineUsers", onlineUsers);
    });

    socket.on("disconnect", () => {
        removeUser(socket.id);

        io.emit("getOnlineUsers", onlineUsers);
    });

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

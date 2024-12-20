    // Thêm xử lý sự kiện typing
    socket.on("startTyping", ({ roomId, userId, username }) => {
        socket.userId = userId; // Lưu userId vào socket để xử lý khi disconnect
        addTypingUser(roomId, userId, username);
        io.to(roomId).emit("typingStatus", Array.from(typingUsers.get(roomId) || []));

        // Tự động xóa trạng thái typing sau 3 giây không có hoạt động
        setTimeout(() => {
            removeTypingUser(roomId, userId);
            io.to(roomId).emit("typingStatus", Array.from(typingUsers.get(roomId) || []));
        }, 3000);
    });

    socket.on("stopTyping", ({ roomId, userId }) => {
        removeTypingUser(roomId, userId);
        io.to(roomId).emit("typingStatus", Array.from(typingUsers.get(roomId) || []));
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

    let typingUsers = new Map(); // Map của roomId -> array of typing users

// Thêm function để quản lý người đang soạn tin nhắn
const addTypingUser = (roomId, userId, username) => {
if (!typingUsers.has(roomId)) {
typingUsers.set(roomId, []);
}
const roomTyping = typingUsers.get(roomId);
if (!roomTyping.some((user) => user.userId === userId)) {
roomTyping.push({ userId, username });
typingUsers.set(roomId, roomTyping);
}
};

const removeTypingUser = (roomId, userId) => {
if (typingUsers.has(roomId)) {
const roomTyping = typingUsers.get(roomId);
const updatedTyping = roomTyping.filter((user) => user.userId !== userId);
if (updatedTyping.length === 0) {
typingUsers.delete(roomId);
} else {
typingUsers.set(roomId, updatedTyping);
}
}
};

io.to(chatRoomId).emit("typingStatus", Array.from(typingUsers.get(chatRoomId) || []));

    typingUsers.forEach((users, roomId) => {
            removeTypingUser(roomId, socket.userId);
            io.to(roomId).emit("typingStatus", Array.from(typingUsers.get(roomId) || []));
        });


    socket.on("joinRoom", (roomId) => {
        socket.join(roomId);
        console.log(`Người dùng ${socket.id} đã tham gia phòng ${roomId}`);
    });

    socket.on("leaveRoom", (roomId) => {
        socket.leave(roomId);
        console.log(`Người dùng ${socket.id} đã rời khỏi phòng ${roomId}`);
    });

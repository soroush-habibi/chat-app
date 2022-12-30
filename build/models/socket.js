const log = console.log;
export default class socketIo {
    constructor(socket) {
        this.socket = socket;
    }
    joinEvent() {
        this.socket.on("join", (rooms) => {
            this.socket.join(rooms);
        });
    }
    sendInvite() {
        this.socket.on("invite", (username, targetUser, chatId) => {
            this.socket.to(targetUser).emit("invite", username, chatId);
        });
    }
    acceptInvite() {
        this.socket.on("acceptInvite", (chatId) => {
            this.socket.to(chatId).emit("accept", chatId);
        });
    }
    declineInvite() {
        this.socket.on("declineInvite", (chatId) => {
            this.socket.to(chatId).emit("decline", chatId);
        });
    }
    sendMessage() {
        this.socket.on("sendMessage", (chatId, message) => {
            this.socket.to(chatId).emit("send", chatId, message);
        });
    }
}

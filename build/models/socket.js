const log = console.log;
export default class socketIo {
    static register(socket) {
        this.socket = socket;
    }
    static joinEvent() {
        this.socket.on("join", (rooms) => {
            this.socket.join(rooms);
        });
    }
    static joinManual(rooms) {
        this.socket.join(rooms);
    }
    static sendInvite(username, targetUser, chatId) {
        this.socket.to(targetUser).emit("invite", username, chatId);
    }
    static acceptInvite() {
        this.socket.on("acceptInvite", (chatId) => {
            this.socket.emit("acceptInvite", chatId);
        });
    }
    static declineInvite() {
        this.socket.on("declineInvite", (chatId) => {
            log("got it");
            this.socket.emit("declineInvite", chatId);
        });
    }
}

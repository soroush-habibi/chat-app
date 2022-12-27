const log = console.log;
export default class socketIo {
    static register(socket) {
        this.socket = socket;
    }
    static joinEvent() {
        this.socket.on("join", (rooms) => {
            for (let i of rooms) {
                log(i);
                this.socket.join(i);
            }
        });
    }
    static joinManual(rooms) {
        for (let i of rooms) {
            this.socket.join(i);
        }
    }
    static sendInvite(username, targetUser, chatId) {
        this.socket.to(targetUser).emit("invite", username, chatId);
    }
}

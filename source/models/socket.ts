import { Socket } from 'socket.io';

const log = console.log;

export default class socketIo {
    private static socket: Socket;
    static register(socket: Socket) {
        this.socket = socket;
    }

    static joinEvent() {
        this.socket.on("join", (rooms: string[]) => {
            this.socket.join(rooms);
        });
    }

    static joinManual(rooms: string[]) {
        this.socket.join(rooms);
    }

    static sendInvite(username: string, targetUser: string, chatId: string) {
        this.socket.to(targetUser).emit("invite", username, chatId);
    }

    static acceptInvite() {
        this.socket.on("acceptInvite", (chatId: string) => {
            this.socket.emit("acceptInvite", chatId);
        });
    }

    static declineInvite() {
        this.socket.on("declineInvite", (chatId: string) => {
            this.socket.emit("declineInvite", chatId);
        });
    }
}
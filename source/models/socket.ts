import { Socket } from 'socket.io';

const log = console.log;

export default class socketIo {
    constructor(private socket: Socket) { }

    joinEvent() {
        this.socket.on("join", (rooms: string[]) => {
            this.socket.join(rooms);
        });
    }

    sendInvite() {
        this.socket.on("invite", (username: string, targetUser: string, chatId: string) => {
            this.socket.to(targetUser).emit("invite", username, chatId);
        });
    }

    acceptInvite() {
        this.socket.on("acceptInvite", (chatId: string) => {
            this.socket.to(chatId).emit("accept", chatId);
        });
    }

    declineInvite() {
        this.socket.on("declineInvite", (chatId: string) => {
            this.socket.to(chatId).emit("decline", chatId);
        });
    }

    sendMessage() {
        this.socket.on("sendMessage", (chatId, message) => {
            this.socket.to(chatId).emit("send", chatId, message);
        });
    }
}
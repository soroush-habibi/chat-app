import { Socket } from 'socket.io';

const log = console.log;

export default class socketIo {
    private static socket: Socket;
    static register(socket: Socket) {
        this.socket = socket;
    }

    static joinEvent() {
        this.socket.on("join", (rooms: string[]) => {
            for (let i of rooms) {
                log(i);
                this.socket.join(i);
            }
        });
    }

    static joinManual(rooms: string[]) {
        for (let i of rooms) {
            this.socket.join(i);
        }
    }

    static sendInvite(username: string, targetUser: string, chatId: string) {
        this.socket.to(targetUser).emit("invite", username, chatId);
    }
}
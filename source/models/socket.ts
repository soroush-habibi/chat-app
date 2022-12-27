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
                this.socket.join(i);
            }
        });
    }

    static joinManual(rooms: string[]) {
        for (let i of rooms) {
            this.socket.join(i);
        }
    }
}
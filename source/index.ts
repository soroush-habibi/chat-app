import 'dotenv/config';
import express from 'express';
import { Server } from 'socket.io';

import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

let temp: string[] = path.dirname(fileURLToPath(import.meta.url)).split('');
temp.splice(temp.length - 6);
const ROOT = temp.join('');
process.env.ROOT = ROOT;
const log = console.log;
const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.on("connection", (socket) => {
    log("someone connect" + socket.id)
});

app.use(express.json());
app.use(express.static(path.join(process.env.ROOT, 'public')));

app.use((req, res) => {
    res.sendFile(path.join(ROOT, 'views/index.html'));
})

server.listen(process.env.PORT, () => {
    log(`server is running on port ${process.env.PORT}`)
});
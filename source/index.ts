import 'dotenv/config';
import express from 'express';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

import viewsRouter from './routes/viewsRoute.js';
import apiRouter from './routes/apiRoute.js';
import socketModule from './models/socket.js';

let temp: string[] = path.dirname(fileURLToPath(import.meta.url)).split('');
temp.splice(temp.length - 6);
const ROOT = temp.join('');
process.env.ROOT = ROOT;
const log = console.log;
const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.on("connection", (socket) => {
    log("someone connect to PV with id " + socket.id);
    socketModule.register(socket);
    socketModule.joinEvent();
    socketModule.acceptInvite();
    socketModule.declineInvite();
});

app.use(express.json());
app.use(express.static(path.join(process.env.ROOT, 'public')));
app.use(cookieParser());
app.use(helmet());

app.use("/", viewsRouter);
app.use("/api", apiRouter);

server.listen(process.env.PORT, () => {
    log(`server is running on port ${process.env.PORT}`);
});
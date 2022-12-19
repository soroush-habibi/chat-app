import 'dotenv/config';
import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import viewsRouter from './routes/viewsRoute.js';
let temp = path.dirname(fileURLToPath(import.meta.url)).split('');
temp.splice(temp.length - 6);
const ROOT = temp.join('');
process.env.ROOT = ROOT;
const log = console.log;
const app = express();
const server = http.createServer(app);
const io = new Server(server);
io.of("/pv").on("connection", (socket) => {
    log("someone connect to PV with id " + socket.id);
});
io.of("/gp").on("connection", (socket) => {
    log("someone connect to GP with id " + socket.id);
});
app.use(express.json());
app.use(express.static(path.join(process.env.ROOT, 'public')));
app.use("/", viewsRouter);
server.listen(process.env.PORT, () => {
    log(`server is running on port ${process.env.PORT}`);
});

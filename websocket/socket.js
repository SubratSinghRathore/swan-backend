import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        credentials: true
    }
});

io.on('connect', (socket) => {

    const token = socket.handshake.headers.cookie;
    socket.join(socket.id, () => {
        console.log('joined')
    })
    console.log('user connected', socket.id);

    socket.on('disconnect', () => {
        console.log('user disconnected', socket.id);
    })
});

export {
    app, server
}
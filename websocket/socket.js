import express from 'express';
import { createServer } from 'http';
import { disconnect } from 'process';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        credentials: true
    }
});

const allUsers = new Map();
io.on('connect', (socket) => {
    const token = socket.handshake.headers.cookie;
    // Setting as online user and joining to their private room of their user_id
    socket.on('setStatus', (user_id) => {
        allUsers.set(user_id, socket.id);
        socket.join(user_id);
    });

    //Sending back all online users
    socket.emit('allUsers', Array.from(allUsers));


    //Client to server event
    socket.on('client-to-server-message', (obj) => {
        //Server to client event
        socket.to(obj.to).emit('server-to-client-message', obj.message);
    });




    // Updating all online users on disconnect
    socket.on('disconnect', () => {
        for (const [user_id, id] of allUsers) {
            if (id == socket.id) {
                allUsers.delete(user_id);
            }
        }
    })
});

export {
    app, server
}
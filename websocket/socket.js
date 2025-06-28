import express from 'express';
import { createServer } from 'http';
import { disconnect } from 'process';
import { Server } from 'socket.io';
import pool from '../router/database/mysql.database.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'https://swan-chat.vercel.app',
        credentials: true
    }
});

const allUsers = new Map();
io.on('connect', (socket) => {

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
        socket.to(obj.to).emit('server-to-client-message', obj);
        //Saving to database
        try {
            (async function (obj) {
                const sql = 'INSERT INTO messages(sender_id, receiver_id, message) VALUES(?, ?, ?)';
                const values = [obj.from, obj.to, obj.message];
                await pool.query(sql, values);
            })(obj);
        } catch (error) {
            console.log('error in storing chat', error);
        }

        //adding notification if user is offline
        if (!allUsers.has(obj.to)) {
            try {
                (async function (obj) {
                    const sql = 'INSERT INTO notifications(sender_id, receiver_id, notification_type, notification_description) VALUES(?, ?, ?, ?)';
                    const values = [obj.from, obj.to, 'message', obj.message];
                    await pool.query(sql, values);
                })(obj)
            } catch (error) {
                console.log('error in sending message notification', error);
            }
        }


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

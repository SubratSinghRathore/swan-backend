import dotenv from "dotenv";
dotenv.config();
import cookieParser from 'cookie-parser';
import express from 'express';
import { app, server } from './websocket/socket.js';

import cors from 'cors';

import auth from "./router/auth.routes.js";
import post from "./router/post.routes.js";
import feed from './router/allposts.route.js';

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,              // Allow cookies and credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Custom-Header']
}));
app.use(cookieParser());
app.use(express.json({limit: '10mb'}));
app.use("/auth", auth);
app.use('/post', post);
app.use('/feed', feed);

app.get("/", async (req, res) => {
    res.send('all perfect')
})

server.listen(process.env.PORT, ()=> console.log('listening on port:', process.env.PORT))
import dotenv from "dotenv";
dotenv.config();
import cookieParser from 'cookie-parser';
import express from 'express';
const app = express();
import cors from 'cors';

import auth from "./router/auth.routes.js";

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,              // Allow cookies and credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Custom-Header']
}));
app.use(cookieParser());
app.use(express.json());
app.use("/auth", auth);

app.get("/", async (req, res) => {
    res.send('all perfect')
})

app.listen(process.env.PORT, ()=> console.log('listening on port:', process.env.PORT))
import dotenv from "dotenv";
dotenv.config();
import cookieParser from 'cookie-parser';
import express from 'express';
const app = express();

import auth from "./router/auth.routes.js";

app.use(cookieParser());
app.use(express.json());
app.use("/auth", auth);

app.get("/", async (req, res) => {
    
})

app.listen(process.env.PORT, ()=> console.log('listening on port:', process.env.PORT))
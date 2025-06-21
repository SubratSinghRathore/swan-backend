import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') })

//creating jwt token and storing in cookie as user device

const genToken = (user_name, user_email, user_id, res) => {
    const token = jwt.sign({ user_name, user_email, user_id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie('jwt', token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'none',
        secure: process.env.JWT_SECURE !== "development",
        domain: 'swan-backend.onrender.com' 
    });
    return token;
}

export default genToken;
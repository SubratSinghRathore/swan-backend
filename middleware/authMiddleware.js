import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import pool from '../router/database/mysql.database.js';

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        } else {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const sqlForAuthentication = 'SELECT * FROM users WHERE user_name = ? AND user_email = ? AND user_id = ?';
            const valuesForAuthentication = [decoded.user_name, decoded.user_email, decoded.user_id];
            const [userDetailsMatch] = await pool.query(sqlForAuthentication, valuesForAuthentication);
            if (userDetailsMatch === 0) {
                return res.status(401).json({
                    msg: 'unotrized : user not found or invalid cookie'
                })
            } else {
                req.user = userDetailsMatch[0];
                next();
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(401).json({
            msg: "unauthorize user invalid or server error"
        });
    }
}

export default authMiddleware;
import express from 'express';
const route = express();
import authMiddleware from '../middleware/authMiddleware.js';
import pool from './database/mysql.database.js';

route.use(express.json());

route.post('/posts', authMiddleware, async (req, res) => {
    try {
        const offset = parseInt(req.body.offset);
        const sql = 'SELECT * FROM posts ORDER BY created_at DESC LIMIT ? offset ?'
        const values = [15, offset];
        const [posts] = await pool.query(sql, values);
        return res.status(200).json({ posts: posts });
    } catch (error) {
        console.log('error in fetching posts', error);
    }
});

route.post('/post/origin', authMiddleware, async (req, res) => {
    try {
        const origin = parseInt(req.body.origin);
        const sql = 'SELECT user_name, user_profile_url FROM users WHERE user_id = ?';
        const values = [origin];
        const [originDetails] = await pool.query(sql, values);
        return res.status(200).json({originDetails});
    } catch (error) {
        console.log('error in origin post', error);
    }
})

export default route;
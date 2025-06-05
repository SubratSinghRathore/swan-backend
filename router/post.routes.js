import express from 'express';
const router = express();
import authMiddleware from '../middleware/authMiddleware.js';
import cloudinary from '../utilities/cloudinary.js';
import pool from './database/mysql.database.js';

router.use(express.json());

router.post('/image', authMiddleware, async (req, res) => {
    try {
        //uploading image to cloudinary
        var { image, description } = req.body;
        if (!image) { return res.status(400).json({ msg: 'image not found' }) };
        if (!description) { description = 'no description' };
        const uploadImage = await cloudinary.uploader.upload(image);
        const uploadImageUrl = uploadImage.secure_url;

        //storing uri in database
        const sql = 'INSERT INTO posts(post_id, description, post_url, origin, total_likes) VALUES(?, ?, ?, ?, ?)';
        const values = [null, description, uploadImageUrl, req.user.user_id, 0];
        const [resultForimage] = await pool.query(sql, values);

        //sending response back to user
        return res.status(200).json({ msg: resultForimage });
    } catch (error) {
        console.log("error in posting image", error);
    }
})

export default router;
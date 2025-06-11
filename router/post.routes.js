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
        const uploadImage = await cloudinary.uploader.upload(image, {width: 1000, height: 1000, crop: 'auto', gravity: 'auto'});
        const uploadImageUrl = uploadImage.secure_url;

        //storing uri in database
        const sql = 'INSERT INTO posts(post_id, description, post_url, origin, total_likes) VALUES(?, ?, ?, ?, ?)';
        const values = [null, description, uploadImageUrl, req.user.user_id, 0];
        const [resultForimage] = await pool.query(sql, values);

        //sending response back to user
        if (resultForimage.affectedRows == 1) {
            return res.status(200).json({ msg: "upload successful" });
        } else {
            return res.status(200).json({ msg: "upload unsuccessful" });
        }

    } catch (error) {
        console.log("error in posting image", error);
    }
})

router.put('/like', authMiddleware, async (req, res) => {
    try {
        const post_id = req.body.post_id;
        const sql = 'UPDATE posts SET total_likes = total_likes + 1 WHERE post_id = ?';
        const values = [post_id]
        const [postLike] = await pool.query(sql, values);
        return res.status(200).json({msg: 'Post like successfully'})
    } catch (error) {
        console.log('error in adding like to post', error);
    }
});

export default router;
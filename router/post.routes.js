import express from 'express';
const router = express();
import authMiddleware from '../middleware/authMiddleware.js';
import cloudinary from '../utilities/cloudinary.js';
import pool from './database/mysql.database.js';
import addNotification from '../utilities/add.notification.js';

router.use(express.json());

router.post('/image', authMiddleware, async (req, res) => {
    try {
        //uploading image to cloudinary
        var { image, description } = req.body;
        if (!image) { return res.status(400).json({ msg: 'image not found' }) };
        if (!description) { description = 'no description' };
        const uploadImage = await cloudinary.uploader.upload(image, { width: 1000, height: 1000, crop: 'auto', gravity: 'auto' });
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

        //checking post already liked
        const sqlToCheckLike = 'SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?';
        const valuesToCheckLike = [post_id, req.user.user_id];
        const [checkLike] = await pool.query(sqlToCheckLike, valuesToCheckLike);

        if (checkLike.length > 0) {
            //already liked

            //removing one like
            const sql = 'UPDATE posts SET total_likes = total_likes - 1 WHERE post_id = ?';
            const values = [post_id]
            await pool.query(sql, values);

            //removing user liked
            const sqlToRemove = 'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?';
            const valuesToRemove = [post_id, req.user.user_id];
            const [addLike] = await pool.query(sqlToRemove, valuesToRemove);

            //sending back total likes
            const sqlForTotalLikes = 'SELECT total_likes FROM posts WHERE post_id = ?';
            const valuesForTotalLikes = [post_id];
            const [totalLikes] = await pool.query(sqlForTotalLikes, valuesForTotalLikes);
            return res.status(200).json(totalLikes[0]);
        } else {

            //updating total likes post
            const sql = 'UPDATE posts SET total_likes = total_likes + 1 WHERE post_id = ?';
            const values = [post_id]
            await pool.query(sql, values);

            //add new like to post
            const sqlToAdd = 'INSERT INTO post_likes (post_id, user_id) values(?, ?)';
            const valuesToAdd = [post_id, req.user.user_id];
            const [addLike] = await pool.query(sqlToAdd, valuesToAdd);

            //finding origin of post for sending notification
            const sqlForPostOrigin = 'SELECT origin FROM posts WHERE post_id = ?';
            const valuesForPostOrigin = [post_id];
            const [receiver_id] = await pool.query(sqlForPostOrigin, valuesForPostOrigin);

            //sending notification
            const type = 'like';
            addNotification(req.user.user_id, receiver_id[0].origin, type);

            //sending back total likes
            const sqlForTotalLikes = 'SELECT total_likes FROM posts WHERE post_id = ?';
            const valuesForTotalLikes = [post_id];
            const [totalLikes] = await pool.query(sqlForTotalLikes, valuesForTotalLikes);
            return res.status(200).json(totalLikes[0]);
        }

    } catch (error) {
        console.log('error in adding like to post', error);
    }
});

router.get('/all', authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const sql = 'SELECT * FROM posts WHERE origin = ?';
        const values = [user_id];
        const [allPosts] = await pool.query(sql, user_id);
        res.send(allPosts);
    } catch (error) {
        console.log('error in fetching all posts fro specific user', error);
    }
});

export default router;
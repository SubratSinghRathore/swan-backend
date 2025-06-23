import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import pool from './database/mysql.database.js';
import addNotification from '../utilities/add.notification.js';
const route = express();

route.post('/addfriend', authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const friend_id = req.body.friend_id;
        //Checking user already friend or not
        try {
            const sql = 'SELECT * FROM friends WHERE user_id = ? AND friend_id = ?';
            const values = [user_id, friend_id];
            const [checkFriend] = await pool.query(sql, values);
            if (checkFriend[0]) {
                return res.status(200).json({ msg: 'Already friend' })
            } else {
                const sql = 'INSERT INTO friends(user_id, friend_id) VALUES(?, ?)';
                const values = [user_id, friend_id];
                const [addfriend] = await pool.query(sql, values);
                if (addfriend.affectedRows === 1) {
                    const type = 'friend_request';
                    addNotification(user_id, friend_id, type);
                    return res.status(200).json({ msg: 'friend added successfully' })
                } else {
                    return res.status(400).json({ msg: 'Failed to add friend' });
                }
            }
        } catch (error) {

        }

    } catch (error) {
        console.log('error in adding friend', error);
        return res.status(500).json({ msg: 'Internal server error' });
    }
});

route.get('/friends', authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const sql = 'SELECT friend_id FROM friends WHERE user_id = ?';
        const values = [user_id];
        const [allFriends] = await pool.query(sql, values);
        return res.status(200).json({ allFriends })
    } catch (error) {
        console.log('error in fetching all friends', error);
        return res.status(500).json({ msg: 'Internal error' })
    }
})

route.post('/friendDetails', authMiddleware, async (req, res) => {
    try {
        const friend_id = req.body.friend_id;
        const sql = 'SELECT user_id, user_name, user_profile_url FROM users WHERE user_id = ?';
        const values = [friend_id];
        const [friendDetails] = await pool.query(sql, values);
        if(friendDetails) {
            return res.status(200).json({ friendDetails });
        } else { return res.status(400).json({ msg: 'cannot find friend details' }); }
    } catch (error) {
        console.log('error in finding friend in database', error);
    }
});

route.delete('/unfriend', authMiddleware, async (req, res) => {
    try {
        const friend_id = req.body.friend_id;
        const sql = 'DELETE FROM friends WHERE friend_id = ? AND user_id = ?';
        const values = [friend_id, req.user.user_id];
        const [unfriend] = await pool.query(sql, values);
        if (unfriend.affectedRows != 0) { return res.status(200).json({ msg: 'unfriend sucessfully'}) }
        else {return res.status(200).json({ msg: 'fail to unfriend' }) }
    } catch (error) {
        console.log('error in removing friend', error);
        return res.status(500).json({ msg: 'fail to unfriend' }) 
    }
})

route.post('/chats', async (req, res) => {
    try {
        const { user_id, friend_id } = req.body;
        const sql = 'SELECT sender_id, message FROM messages WHERE (sender_id = ? AND receiver_id = ?) or (sender_id = ? AND receiver_id = ?) ORDER BY TIMESTAMP';
        const values  = [user_id, friend_id, friend_id, user_id];
        const [messages] = await pool.query(sql, values);
        return res.status(200).json({messages});
    } catch (error) {
        console.log('error in fetching messages from DB', error);
        return res.status(500).json({msg: 'simething went erong'});
    }
})

export default route;
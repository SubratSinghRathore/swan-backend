import pool from "../router/database/mysql.database.js";

const addNotification = async function (from, to, type) {
    try {

        switch (type) {
            case 'friend_request':
                {
                    const sql = 'INSERT INTO notifications (sender_id, receiver_id, notification_type, notification_description) VALUES(?, ?, ?, ?)';
                    const values = [from, to, type, 'send you a friend request'];
                    const [sendNotification] = await pool.query(sql, values);
                    break;
                }

            case 'like':
                {
                    const sql = 'INSERT INTO notifications (sender_id, receiver_id, notification_type, notification_description) VALUES(?, ?, ?, ?)';
                    const values = [from, to, type, 'like your post'];
                    const [sendNotification] = await pool.query(sql, values);
                    break;
                }

            case 'comment':
                {
                    const sql = 'INSERT INTO notifications (sender_id, receiver_id, notification_type, notification_description) VALUES(?, ?, ?, ?)';
                    const values = [from, to, type, 'comment on your post'];
                    const [sendNotification] = await pool.query(sql, values);
                    break;
                }

            case 'message':
                {
                    const sql = 'INSERT INTO notifications (sender_id, receiver_id, notification_type, notification_description) VALUES(?, ?, ?, ?)';
                    const values = [from, to, type, 'send you a message'];
                    const [sendNotification] = await pool.query(sql, values);
                    break;
                }

            default: console.log(from, to, type);

                break;
        }

    } catch (error) {
        console.log('error in adding notification', error);
    }
}

export default addNotification;
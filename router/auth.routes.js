import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import express from "express";
const auth = express();
import bcrypt from "bcryptjs";
import pool from "./database/mysql.database.js"
import authMiddleware from '../middleware/authMiddleware.js';
import genToken from "../utilities/auth.token.js";
import cloudinary from "../utilities/cloudinary.js";

auth.use(express.json());

auth.post('/attempt', async (req, res) => {
    const user_name = req.body.user_name;
    try {
        const sql = 'SELECT user_name FROM users WHERE user_name = ?';
        const values = [user_name];
        const [existingUser] = await pool.query(sql, values);
        if (!existingUser[0]) {
            return res.status(200).json({
                availability: true
            });
        } else {
            return res.status(200).json({
                availability: false
            });
        }
    } catch (error) {
        console.log('error in checking username availability', error);
    }
})

auth.get('/me', authMiddleware, async (req, res) => {
    res.status(200).json({
        userData: req.user
    });
});

auth.get('/users', authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const sql = 'SELECT user_id, user_name, user_profile_url FROM users WHERE user_id != ?';
        const values = [user_id]
        const [users] = await pool.query(sql, values);
        res.status(200).json({
            users
        })
    } catch (error) {
        console.log("error in fetching users from database", error);
    }
});

auth.post("/signup", async (req, res) => {
    let { user_name, user_email, user_password, user_mobile_no, user_profile_url } = req.body;

    if (!user_mobile_no) user_mobile_no = null;
    if (!user_profile_url) user_profile_url = null;
    if (!user_name || !user_email || !user_password) {
        res.status(400).json({
            msg: "please fill all credentials"
        })
    } else {

        try {

            //creating hash password
            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(user_password, salt);

            if (user_profile_url !== null) {
                //creating user in database with user_profile_url
                const sqlForCreatingUser = 'INSERT INTO users (user_id, user_name, user_email, user_password, user_mobile_no, user_profile_url) VALUES (?, ?, ?, ?, ?, ?)';
                const valuesForCreatingUser = [null, user_name, user_email, hashPassword, user_mobile_no, user_profile_url];
                await pool.query(sqlForCreatingUser, valuesForCreatingUser);
            } else {
                //creating user in database without user_profile_url
                const sqlForCreatingUser = 'INSERT INTO users (user_id, user_name, user_email, user_password, user_mobile_no) VALUES (?, ?, ?, ?, ?)';
                const valuesForCreatingUser = [null, user_name, user_email, hashPassword, user_mobile_no];
                await pool.query(sqlForCreatingUser, valuesForCreatingUser);
            }


            //fetching user_id and user_profile_url from databade for jwt
            const sqlForUserId = 'SELECT * FROM users WHERE user_name = ? AND user_password = ?';
            const valuesForUserId = [user_name, hashPassword];
            const [resultForUserId] = await pool.query(sqlForUserId, valuesForUserId);
            const user_id = resultForUserId[0].user_id;
            user_profile_url = resultForUserId[0].user_profile_url;

            //configuring jwt token
            genToken(user_name, user_email, user_id, res);

            res.status(200).json({
                user_id,
                user_email,
                user_name,
                user_profile_url
            });

        } catch (error) {
            console.log(error);
        }
    }

});


auth.post("/login", async (req, res) => {

    try {
        //assigning values
        const { user_email_or_user_name, user_password } = req.body;
        const user_email = user_email_or_user_name;
        const user_name = user_email_or_user_name;

        //checking the user in database by email
        const sqlForUserDetail = 'SELECT * FROM users WHERE user_email = ?';
        const valueForUserDetail = [user_email];
        const [resultForUserDetail] = await pool.query(sqlForUserDetail, valueForUserDetail);

        //comparing the password
        if (resultForUserDetail.length !== 0) {
            for (let i = 0; i < resultForUserDetail.length; i++) {
                const isPasswordCorrect = await bcrypt.compare(user_password, resultForUserDetail[i].user_password);
                if (isPasswordCorrect) {
                    //creating jwt token and storing in cookie as user device
                    genToken(resultForUserDetail[i].user_name, resultForUserDetail[i].user_email, resultForUserDetail[i].user_id, res);

                    return res.status(200).json({
                        user_id: resultForUserDetail[i].user_id,
                        user_email: resultForUserDetail[i].user_email,
                        user_name: resultForUserDetail[i].user_name,
                        user_profile_url: resultForUserDetail[i].user_profile_url
                    });
                }
            }
        } else {
            //checking the user in database by username
            try {
                //checking the user in database
                const sqlForUserDetail = 'SELECT * FROM users WHERE user_name = ?';
                const valueForUserDetail = [user_name];
                const [resultForUserDetail] = await pool.query(sqlForUserDetail, valueForUserDetail);

                //comparing the password
                if (resultForUserDetail.length !== 0) {
                    for (let i = 0; i < resultForUserDetail.length; i++) {
                        const isPasswordCorrect = await bcrypt.compare(user_password, resultForUserDetail[i].user_password);
                        if (isPasswordCorrect) {

                            //creating jwt token and storing in cookie as user device
                            genToken(resultForUserDetail[i].user_name, resultForUserDetail[i].user_email, resultForUserDetail[i].user_id, res);

                            return res.status(200).json({
                                user_id: resultForUserDetail[i].user_id,
                                user_email: resultForUserDetail[i].user_email,
                                user_name: resultForUserDetail[i].user_name,
                                user_profile_url: resultForUserDetail[i].user_profile_url
                            });
                        }
                    };
                } else {
                    return res.status(400).json({
                        msg: 'invalid credentials'
                    });
                }
            } catch (error) {
                console.log('error in login', error);
            }
        }

    } catch (error) {
        console.log('error in login', error);
    }
});


auth.post("/logout", async (req, res) => {
    res.cookie('jwt', '', {
        maxAge: 0,
        httpOnly: true,
        sameSite: 'none',
        secure: process.env.JWT_SECURE !== "development",
        domain: 'swan-backend.onrender.com'
    });
    res.status(200).json({ msg: 'logout successfully' });
})

auth.post('/update/profile', authMiddleware, async (req, res) => {
    try {
        const type = req.body.type;
        if (type === 'user_password') {
            try {
                // generating new hash password
                const newPassword = req.body.user_password;
                const salt = await bcrypt.genSalt(10)
                const hashPassword = await bcrypt.hash(newPassword, salt);

                //storing new hash password in database
                const sql = 'UPDATE users SET user_password = ? WHERE user_id = ?';
                const values = [hashPassword, req.user.user_id];
                const [updatedValues] = await pool.query(sql, values);

                //sending new jwt web token
                genToken(req.user.user_name, req.user.user_email, req.user.user_id, res);

                return res.status(200).json({ msg: 'password updated successfully' });

            } catch (error) {
                console.log(error);
                return res.status(500).json({ msg: 'unable to reset password' });
            }
        } else if (type === 'profile_pic') {
            try {

                const { profile_pic } = req.body;
                const user_id = req.user.user_id;

                if (!profile_pic) {
                    return res.status(400).json({
                        msg: 'profile picture not uploaded'
                    });
                } else {

                    const uploadPicture = await cloudinary.uploader.upload(profile_pic, { width: 1000, height: 1000, crop: "auto", gravity: "auto" });
                    const user_profile_url = uploadPicture.secure_url;

                    //reseting new profile picture
                    const sql = 'UPDATE users SET user_profile_url = ? WHERE user_id = ?';
                    const values = [user_profile_url, req.user.user_id];
                    const [{ affectedRows, changedRows }] = await pool.query(sql, values);

                    if (affectedRows === 0) {
                        return res.status(404).json({ msg: 'User not found' });
                    }

                    if (changedRows === 0) {
                        return res.status(200).json({ msg: 'No update needed, URL unchanged' });
                    }

                    return res.status(200).json({
                        msg: 'Profile URL updated successfully',
                        user_profile_url
                    });

                }

            } catch (error) {
                return res.status(500).json({
                    msg: "internal server error"
                })
            }
        } else if (type === 'user_name') {
            try {
                const new_user_name = req.body.user_name;
                if (!new_user_name) {
                    return res.status(400).json({ msg: 'username not found' })
                } else {
                    //checking the username already exist or not.
                    const sql = 'SELECT * FROM users WHERE user_name = ?';
                    const values = [new_user_name];
                    const [matchedUsername] = await pool.query(sql, values);
                    if (matchedUsername.length !== 0) {
                        return res.status(400).json({ msg: 'username already exists' })
                    } else {
                        const sql = 'UPDATE users SET user_name = ? WHERE user_id = ?';
                        const values = [new_user_name, req.user.user_id];
                        const [{ affectedRows, changedRows }] = await pool.query(sql, values);
                        if (affectedRows === 0) {
                            return res.status(404).json({ msg: 'user not found' });
                        }
                        if (changedRows === 0) {
                            return res.status(200).json({ msg: 'No update needed, username unchanged' });
                        }

                        //sending new jwt web token
                        genToken(new_user_name, req.user.user_email, req.user.user_id, res);

                        return res.status(200).json({ msg: 'username updated successfully' });
                    }
                }
            } catch (error) {
                console.log(error);
                return res.status(500).json({ msg: 'internal server error' });
            }

        } else if (type === 'user_email') {
            const new_user_email = req.body.user_email;
            try {
                if (!new_user_email) {
                    return res.status(400).json({ msg: "mail not found retry again" })
                } else {
                    const sql = 'UPDATE users SET user_email = ? WHERE user_id = ?';
                    const values = [new_user_email, req.user.user_id];
                    const [{ affectedRows, changedRows }] = await pool.query(sql, values);
                    if (affectedRows === 0) {
                        return res.status(404).json({ msg: 'user not found' });
                    }
                    if (changedRows === 0) {
                        return res.status(200).json({ msg: 'No update needed, email unchanged' });
                    }

                    //sending new twt token with updated email
                    genToken(req.user.user_name, new_user_email, req.user.user_id, res);

                    return res.status(200).json({ msg: 'email updated successfully' });
                }
            } catch (error) {
                console.log(error);
                return res.status(500).json({ msg: 'internal server error' });
            }
        } else if (type === 'user_mobile_no') {
            const new_user_mobile_no = req.body.user_mobile_no;
            try {
                if (!new_user_mobile_no) {
                    return res.status(400).json({ msg: "mobile no not found retry again" })
                } else {
                    const sql = 'UPDATE users SET user_mobile_no = ? WHERE user_id = ?';
                    const values = [new_user_mobile_no, req.user.user_id];
                    const [{ affectedRows, changedRows }] = await pool.query(sql, values);
                    if (affectedRows === 0) {
                        return res.status(404).json({ msg: 'user not found' });
                    }
                    if (changedRows === 0) {
                        return res.status(200).json({ msg: 'No update needed, mobile no unchanged' });
                    }

                    return res.status(200).json({ msg: 'mobile no updated successfully' });
                }
            } catch (error) {
                console.log(error);
                return res.status(500).json({ msg: 'internal server error' });
            }
        } else {
            return res.status(404).json({ msg: 'something went wrong change type not defined' });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'something went wrong internal server error' });
    }
})

auth.post('/search', authMiddleware, async (req, res) => {
    try {
        const user_name = req.body.user_name;
        const sql = 'SELECT user_id, user_name, user_profile_url FROM users WHERE user_name LIKE ? LIMIT ?';
        const values = [`%${user_name}%`, 10];
        const [allUsers] = await pool.query(sql, values);
        return res.status(200).json({ allUsers });
    } catch (error) {
        console.log('error in search users', error);
    }
});

export default auth;
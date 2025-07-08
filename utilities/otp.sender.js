import nodemailer from 'nodemailer';

const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SWANCHAT_MAIL,
        pass: process.env.SWANCHAT_MAIL_PASSWORD
    }
});

const sendOTP = async (userEmail, otp, res) => {
    const mailOptions = {
        from: process.env.SWANCHAT_MAIL,
        to: userEmail,
        subject: "Your OTP code",
        html: `
        <div style="background-color: #3B82F6; padding: 40px 20px; font-family: Arial, sans-serif; color: white; text-align: center; border-radius: 10px;">
            <h1 style="margin-bottom: 10px;">🔐 Swanchat Verification</h1>
            <p style="font-size: 16px; margin-bottom: 30px;">
                Please use the OTP below to verify your email address:
            </p>
            <div style="background-color: white; color: #3B82F6; display: inline-block; padding: 15px 30px; font-size: 28px; font-weight: bold; border-radius: 8px; letter-spacing: 4px;">
                ${otp}
            </div>
            <p style="margin-top: 30px; font-size: 14px;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
            <p style="margin-top: 5px; font-size: 12px; color: #dbeafe;">If you did not request this, please ignore this email.</p>
        </div>
       `
    }

    try {
        await transport.sendMail(mailOptions);
    } catch (error) {
        console.log('error in sending mail', error);
        return res.status(401).json({ msg: 'invalid email'});
    }
}

export default sendOTP;
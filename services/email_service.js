import sgMail from '@sendgrid/mail'
import dotenv from "dotenv"
dotenv.config()

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export async function sendOTPEmail(toEmail, otp) {
    const msg = {
        to : toEmail,
        from : 'dev.hemant3199@gmail.com',
        subject : 'Your OTP Code for Registration',
        text : `Your OTP is ${otp}. It is valid for 10 minutes.`,
        html : `<p>Your <strong>OTP</strong> is: <strong>${otp}</strong></p><p>This OTP is valid for 10 minutes.</p>`
    };

    try {
        await sgMail.send(msg)
        console.log(`OTP sent to ${toEmail}`);
        return true;
    } catch (error) {
        console.error('SendGrid error:', error.response?.body || error);
        return false;
    }
}

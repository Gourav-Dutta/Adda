import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendOtpEmail(email, otp) {
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Your Email Verification Code",
        text: `Your OTP code is: ${otp}. It expires in 10 minutes please verify!.`,
        html: `<p>Your OTP code for email verification is: <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
    });
}
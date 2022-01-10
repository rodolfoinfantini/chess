import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

const transporter = nodemailer.createTransport({
    service: 'outlook',
    auth: {
        type: 'login',
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
})

export function sendEmail(to, subject, text) {
    transporter.sendMail(
        {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
        },
        (err, info) => {
            if (err) {
                console.log(err)
            }
        }
    )
}

import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

// Hash password
export const prepareHash = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

// Send email with verification code
export const emailCode = async (email: string, code: string): Promise<void> => {
    try {
        const transporter: Transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL as string,
                pass: process.env.PASS as string,
            },
        });

        const myOptions = {
            from: process.env.EMAIL as string,
            to: email,
            subject: 'Verification Code',
            text: 'Hello Welcome, Here is Verification Code to Activate Your Account',
            html: `<h2>${code}</h2>`,
        };

        transporter.sendMail(myOptions, (error, info) => {
            if (error) {
                throw error;
            } else {
                console.log('Email Sent: ' + info.response);
            }
        });

    } catch (error) {
        console.error(error);
    }
};

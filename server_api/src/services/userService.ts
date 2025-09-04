import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer, { Transporter } from 'nodemailer';
import { UserStatus } from '../modules/users/enums/status.enum';
import { IUser, User } from '../modules/users/user.model';



export interface UserDTO {
    user_name: string;
    email: string;
    password: string;
    status?: UserStatus;
    reset_code?: string;
    reset_code_expires?: Date;
}

export const prepareHash = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

export const createUserAccount = async (user: UserDTO): Promise<IUser> => {
    const { user_name, email, password, status} = user;
    const hashedPassword = await prepareHash(password);
    const newUser = new User({
        user_name, email, password: hashedPassword, status,
    });
    return await newUser.save();
};





export const sendCode = async (email: string, reset: boolean): Promise<void> => {
    try {

        const user = await User.findOne({ email });
        if (!user) {
            throw new Error("User with this email does not exist.");
        }
        if (user.status === UserStatus.Suspended) {
            throw new Error("Account has been suspended. Please contact the system administrator.");
        }
        const now = new Date();
        const bufferTime = 2 * 60 * 1000;

        if (user.reset_code && user.reset_code_expires && user.reset_code_expires.getTime() - now.getTime() > bufferTime) {
            return;
        }

        const code = crypto.randomInt(100000000, 999999999).toString(); // 9-digit code
        const expiry = new Date(Date.now() + 10 * 60 * 1000); //10  mins       

        const system_email = process.env.SYS_EMAIL;
        const password = process.env.EMAIL_PASSWORD;
        const transporter: Transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: system_email,
                pass: password,
            },
        });

        const myOptions = {
            from: system_email,
            to: user.email,
            subject: reset ? 'Reset Code' : 'Activation Code',
            text: `Hello, Welcome!
            Here is your ${reset ? 'Reset Code to reset your account password' : 'Activation Code to activate your account'}: ${code}`,
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4; color: #333;">
            <h2 style="color: ${reset ? '#f44336' : '#4CAF50'};">${reset ? 'Password Reset Request' : 'Welcome to IRPMS Service!'}</h2>
            <p style="font-size: 16px;">Hello,</p>
            <p style="font-size: 16px;">Here is your <strong>${reset ? 'Reset Code to reset your account password' : 'Activation Code to activate your account'}</strong>:</p>
            <div style="margin: 20px 0; padding: 15px 25px; background-color: #fff; border: 2px dashed ${reset ? '#f44336' : '#4CAF50'}; font-size: 24px; font-weight: bold; color: #333; border-radius: 6px; text-align: center;">
                ${code}
            </div>
            <p style="font-size: 14px; color: #666;">If you did not request this, you can safely ignore this email.</p>
        </div>`,
        };

        user.reset_code = code;
        user.reset_code_expires = expiry;

        await new Promise<void>((resolve, reject) => {
            transporter.sendMail(myOptions, (error, info) => {
                if (error) {
                    console.error("Failed to send email:", error);
                    return reject(error);
                }
                console.log('Email Sent: ' + info.response);
                resolve();
            });
        });

        await user.save();
    } catch (error) {
        console.error("Error in emailCode:", error);
        throw error;
    }
};



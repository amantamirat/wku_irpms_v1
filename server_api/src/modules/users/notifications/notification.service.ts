import { UserStatus } from "../enums/status.enum";
import { User } from "../user.model";
import crypto from 'crypto';
import nodemailer, { Transporter } from 'nodemailer';


export interface NotificationDto {
    email?: string;
    uid?: string;
    type: "reset" | "activation";
}

export class NotificationService {

    static async emailResetCode(data: NotificationDto) {

        const isReset = data.type === "reset";

        const user = await User.findOne({ email: data.email, status: { $ne: UserStatus.Suspended } });
        if (!user) {
            throw new Error("User with this email does not exist.");
        }

        const now = new Date();
        const bufferTime = 2 * 60 * 1000;

        if (user.reset_code && user.reset_code_expires && user.reset_code_expires.getTime() - now.getTime() > bufferTime) {
            return;
        }

        const code = crypto.randomInt(100000000, 999999999).toString();
        const expiry = new Date(Date.now() + 15 * 60 * 1000); //15  mins       

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
            subject: isReset ? 'Reset Code' : 'Activation Code',
            text: `Hello, Welcome!
                Here is your ${isReset ? 'Reset Code to reset your account password' : 'Activation Code to activate your account'}: ${code}`,
            html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4; color: #333;">
                <h2 style="color: ${isReset ? '#f44336' : '#4CAF50'};">${isReset ? 'Password Reset Request' : 'Welcome to IRPMS Service!'}</h2>
                <p style="font-size: 16px;">Hello,</p>
                <p style="font-size: 16px;">Here is your <strong>${isReset ? 'Reset Code to reset your account password' : 'Activation Code to activate your account'}</strong>:</p>
                <div style="margin: 20px 0; padding: 15px 25px; background-color: #fff; border: 2px dashed ${isReset ? '#f44336' : '#4CAF50'}; font-size: 24px; font-weight: bold; color: #333; border-radius: 6px; text-align: center;">
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
    };

}

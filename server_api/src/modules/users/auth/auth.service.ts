import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer, { Transporter } from 'nodemailer';
import { UserStatus } from "../enums/status.enum";
import { User } from "../user.model";
import JwtPayload from "./auth.model";
import Applicant from "../../applicants/applicant.model";
import { UserService } from "../user.service";


export interface LoginUserDto {
    user_name: string;
    password: string;
}

export interface VerfyUserDto {
    email: string;
    password?: string;
    reset_code: String;
}

export class AuthService {

    static async loginUser(data: LoginUserDto) {
        const user = await User.findOne({
            $or: [
                { email: data.user_name },
                { user_name: data.user_name }
            ],
            status: { $ne: UserStatus.suspended }
        }).populate('roles');
        if (!user) {
            throw new Error("User not found");
        }

        const isMatch = await bcrypt.compare(data.password, user.password);
        if (!isMatch) {
            throw new Error("Invalid credentials.");
        }

        const linkedApplicant = await Applicant.findOne({ user: user._id }).populate('organization').lean();
        const payload: JwtPayload = {
            id: user._id as string,
            email: user.email,
            user_name: user.user_name,
            roles: user.roles,
            linkedApplicant: linkedApplicant,
            status: user.status
        };
        const token = jwt.sign(payload, process.env.KEY as string, { expiresIn: '2h' });
        //console.log("user:", user.user_name, "logged in.");
        return { token, user: payload };
    }


    static async sendVerificationCode(email: string): Promise<void> {
        const user = await User.findOne({ email, status: { $ne: UserStatus.suspended } });
        if (!user) {
            throw new Error("User does not exist.");
        }
        const now = new Date();
        const bufferTime = 90 * 60 * 1000; //1 hr and 30 mins
        if (user.reset_code && user.reset_code_expires && user.reset_code_expires.getTime() - now.getTime() > bufferTime) {
            return;
        }

        const code = crypto.randomInt(100000000, 999999999).toString(); // 9-digit code
        const expiry = new Date(Date.now() + 120 * 60 * 1000); //120  mins       

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
            subject: 'Your Verification Code',
            text: `Hello, Welcome! Here is your verification code: ${code}`,
            html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4; color: #333;">
            <h2 style="color: #4CAF50;">Welcome to IRPMS Service!</h2>
            <p style="font-size: 16px;">Hello,</p>
            <p style="font-size: 16px;">Here is your <strong>verification code</strong>:</p>
            <div style="margin: 20px 0; padding: 15px 25px; background-color: #fff; border: 2px dashed #4CAF50; font-size: 24px; font-weight: bold; color: #333; border-radius: 6px; text-align: center;">
            ${code}
            </div>
            <p style="font-size: 14px; color: #666;">If you did not request this, you can safely ignore this email.</p>
            </div>`,
        };


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

        user.reset_code = code;
        user.reset_code_expires = expiry;
        await user.save();
    }


    static async resetPassword(data: VerfyUserDto): Promise<void> {
        const { email, reset_code, password } = data;
        if (!password || password.trim() === "") {
            throw new Error("Password not found!");
        }
        const user = await User.findOne({ email, status: { $ne: UserStatus.suspended } });
        if (!user) {
            throw new Error("User not found");
        }
        if (!user.reset_code_expires || user.reset_code_expires < new Date()) {
            throw new Error("Verification code has expired. Please request a new one.");
        }
        if (!user.reset_code || user.reset_code !== reset_code) {
            throw new Error("Invalid verification code.");
        }
        const hashedPassword = await UserService.prepareHash(password);
        user.password = hashedPassword;
        user.reset_code = undefined;
        user.reset_code_expires = undefined;
        await user.save();
    }


    static async activateUser(data: VerfyUserDto): Promise<void> {
        const { email, reset_code } = data;
        const user = await User.findOne({ email, status: UserStatus.pending });
        if (!user) {
            throw new Error("User not found");
        }
        if (!user.reset_code_expires || user.reset_code_expires < new Date()) {
            throw new Error("Verification code has expired. Please request a new one.");
        }
        if (!user.reset_code || user.reset_code !== reset_code) {
            throw new Error("Invalid verification code.");
        }
        user.status = UserStatus.active;
        user.reset_code = undefined;
        user.reset_code_expires = undefined;
        await user.save();
    }

}

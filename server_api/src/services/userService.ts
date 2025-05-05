import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { IUser, User, UserStatus } from '../models/user';


export interface CreateUserDTO {
    user_name: string;
    email: string;
    password: string;
    status?: UserStatus;
}

const prepareHash = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

export const createUserAccount = async (user: CreateUserDTO): Promise<IUser> => {
    const { user_name, email, password, status = UserStatus.Pending } = user;
    const hashedPassword = await prepareHash(password);
    const newUser = new User({
        user_name, email, password: hashedPassword, status,
    });
    return await newUser.save();
};


export const initAdminUser = async (): Promise<void> => {
    try {
        const userName = process.env.ADMIN_USER_NAME;
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;

        if (!userName || !email || !password) {
            throw new Error('Admin credentials are not set in environment variables.');
        }

        const existingAdmin = await User.exists({ email: email });

        if (!existingAdmin) {
            await createUserAccount({
                user_name: userName,
                email: email,
                password: password,
            });
            console.log('Admin user created successfully.');
        } else {
            console.log('Admin user already exists.');
        }
    } catch (error) {
        console.error('Error creating admin user:', error);
        //throw error;
    }
};


export const emailCode = async (email: string, code: string): Promise<void> => {
    try {
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
            to: email,
            subject: 'Verification Code',
            text: 'Hello Welcome, Here is Verification Code to Activate Your Account',
            html: `<h2>${code}</h2>`,
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

    } catch (error) {
        console.error("Error in emailCode:", error);
        // Re-throw if you want to propagate it to controller
        // or remove this if you want to silence it
        throw error;
    }
};

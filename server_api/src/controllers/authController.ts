import { User } from '../models/user';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { errorResponse, successResponse } from '../util/response';
import crypto from 'crypto';
import { emailCode, prepareHash } from '../services/userService';

const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { user_name, password }: { user_name: string; password: string } = req.body;
        const user = await User.findOne({
            $or: [{ email: user_name }, { user_name: user_name }]
        });
        if (!user) {
            errorResponse(res, 401, "Invalid credentials.");
            return;
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            errorResponse(res, 401, "Invalid credentials.");
            return;
        }
        const token = jwt.sign(
            { _id: user._id, email: user.email, user_name: user.user_name }, process.env.KEY as string,
            { expiresIn: '2h' }
        );
        console.log("user:", user.user_name, " logged in.");
        successResponse(res, 201, 'Logged in successfully', {
            token,
            user: {
                _id: user._id,
                user_name: user.user_name,
                email: user.email,
                //roles: user.roles,
                status: user.status
            }
        });
    } catch (error) {
        console.error(error);
        errorResponse(res, 500, (error as Error).message, error);
    }
};

const sendResetCode = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            errorResponse(res, 401, "User with this email does not exist.");
            return;
        }
        const code = crypto.randomInt(100000000, 999999999).toString(); // 9-digit code
        const expiry = new Date(Date.now() + 10 * 60 * 1000); //10  mins

        user.reset_code = code;
        user.reset_code_expires = expiry;
        await user.save();
        await emailCode(email, code);
        successResponse(res, 200, 'Reset code sent to email.', { success: true });
    } catch (error) {
        console.error(error);
        errorResponse(res, 500, 'Failed to send reset code.');
    }
};

const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, resetCode, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            errorResponse(res, 401, "User with this email does not exist.");
            return;
        }
        if (!user.reset_code || user.reset_code !== resetCode) {
            errorResponse(res, 401, "Incorrect reset code.");
            return;
        }
        if (!user.reset_code_expires || user.reset_code_expires < new Date()) {
            errorResponse(res, 401, "Reset code has expired. Please request a new one.");
            return;
        }
        const hashedPassword = await prepareHash(password);
        user.password = hashedPassword;
        user.reset_code = undefined;
        user.reset_code_expires = undefined;
        await user.save();
        successResponse(res, 200, 'Password reset successfully.', { success: true });
    } catch (error) {
        console.error(error);
        errorResponse(res, 500, 'Failed to send reset code.');
    }
};

const authController = {
    loginUser,
    sendResetCode, 
    resetPassword
};

export default authController;
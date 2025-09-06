import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { errorResponse, successResponse } from '../util/response';
import { prepareHash, sendCode } from '../services/userService';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../modules/users/user.model';
import { UserStatus } from '../modules/users/enums/status.enum';
import JwtPayload from '../modules/users/auth/auth.model';

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
        if (user.status === UserStatus.Suspended) {
            errorResponse(res, 401, "Suspended credentials.");
            return;
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            errorResponse(res, 401, "Invalid credentials.");
            return;
        }
        const payload: JwtPayload = {
            email: user.email ?? '',
            user_name: user.user_name,
            status: user.status
        };
        const token = jwt.sign(payload, process.env.KEY as string, { expiresIn: '2h' });
        console.log("user:", user.user_name, " logged in.");
        successResponse(res, 201, 'Logged in successfully', {
            token,
            user: payload
        });
    } catch (error) {
        console.error(error);
        errorResponse(res, 500, (error as Error).message, error);
    }
};

const sendResetCode = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        await sendCode(email, true);
        successResponse(res, 200, 'Reset code sent to email.', { success: true });
    } catch (error) {
        console.error(error);
        errorResponse(res, 500, 'Failed to send reset code.');
    }
};
const sendActivationCode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        await sendCode(req.user?.email || '', false);
        successResponse(res, 200, 'Activation code sent to email.', { success: true });
    } catch (error) {
        console.error(error);
        errorResponse(res, 500, 'Failed to send Activation code.');
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
        if (user.status === UserStatus.Suspended) {
            errorResponse(res, 403, "Account has been suspended. Please contact the system administrator for assistance.");
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

export const activateAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { activationCode } = req.body;
        const user = await User.findOne({ email: req.user?.email });
        if (!user) {
            errorResponse(res, 401, "User not found.");
            return;
        }
        if (user.status !== UserStatus.Pending) {
            errorResponse(res, 400, "Account is already active or suspended.");
            return;
        }
        if (!user.reset_code || user.reset_code !== activationCode) {
            errorResponse(res, 401, "Incorrect activation code.");
            return;
        }
        if (!user.reset_code_expires || user.reset_code_expires < new Date()) {
            errorResponse(res, 401, "Activation code has expired.");
            return;
        }
        user.status = UserStatus.Active;
        user.reset_code = undefined;
        user.reset_code_expires = undefined;
        await user.save();
        successResponse(res, 200, "Account activated successfully.", { success: true });
    } catch (error) {
        console.error(error);
        errorResponse(res, 500, "Failed to activate account.");
    }
};

const authController = {
    loginUser,
    sendResetCode,
    sendActivationCode,
    activateAccount,
    resetPassword
};

export default authController;
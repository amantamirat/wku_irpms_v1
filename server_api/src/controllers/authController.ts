import { User } from '../models/user';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { errorResponse, successResponse } from '../util/response';

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

const authController = {
    loginUser,
};

export default authController;
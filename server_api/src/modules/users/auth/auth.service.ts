import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import { UserStatus } from "../enums/status.enum";
import { User } from "../user.model";
import JwtPayload from "./auth.model";


export interface LoginUserDto {
    user_name: string;
    password: string;
}

export class AuthService {

    static async loginUser(data: LoginUserDto) {
        const user = await User.findOne({ $or: [{ email: data.user_name }, { user_name: data.user_name }] });
        if (!user) {
            throw new Error("User not found");
        }
        if (user.status === UserStatus.Suspended) {
            throw new Error("Suspended credentials.");
        }
        const isMatch = await bcrypt.compare(data.password, user.password);
        if (!isMatch) {
            throw new Error("Invalid credentials.");
        }
        const payload: JwtPayload = {
            email: user.email,
            user_name: user.user_name,
            status: user.status
        };
        const token = jwt.sign(payload, process.env.KEY as string, { expiresIn: '2h' });
        //console.log("user:", user.user_name, "logged in.");
        return { token, user: payload };
    }







}

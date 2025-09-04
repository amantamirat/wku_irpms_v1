import { User } from "./user.model";
import { UserStatus } from "./enums/status.enum";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";



export interface CreateUserDto {
    user_name: string;
    password: string;
    email: string;
    roles: Types.ObjectId[];
    reset_code?: String;
    reset_code_expires?: Date;
    status: UserStatus;
}


export class UserService {

    private static async prepareHash(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    };

    static async createUser(data: CreateUserDto) {
        const hashed = await this.prepareHash(data.password);
        const createdUser = await User.create({ ...data, password: hashed });
        return createdUser;
    }

    static async getUsers() {
        return User.find().populate("roles").lean();
    }

    static async updateUser(id: string, data: Partial<CreateUserDto>) {
        const user = await User.findById(id);
        if (!user) throw new Error("User not found");
        Object.assign(user, data);
        return user.save();
    }

    static async deleteUser(id: string) {
        const user = await User.findById(id);
        if (!user) throw new Error("User not found");
        return await user.deleteOne();
    }
}

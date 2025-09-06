import { User } from "./user.model";
import { UserStatus } from "./enums/status.enum";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import Applicant from "../applicants/applicant.model";



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
        const { password, ...rest } = createdUser.toObject();;
        return rest;
    }

    static async getUsers() {
        const users = await User.find({}, { password: 0 }).populate("roles").lean();
        const usersWithLink = await Promise.all(users.map(async user => {
            const linkedApplicant = await Applicant.findOne({ user: user._id }).lean();
            return {
                ...user,
                linkedApplicant: !!linkedApplicant
            };
        }));
        return usersWithLink;
    }

    static async updateUser(id: string, data: Partial<CreateUserDto>) {
        const user = await User.findById(id);
        if (!user) throw new Error("User not found");
        Object.assign(user, data);
        if (user.isModified("password") && data.password) {
            user.password = await this.prepareHash(user.password);
        }
        const updatedUser = await user.save();
        const { password, ...rest } = updatedUser.toObject(); 
        return rest;
    }

    static async deleteUser(id: string) {
        const user = await User.findById(id);
        if (!user) throw new Error("User not found");
        return await user.deleteOne();
    }
}

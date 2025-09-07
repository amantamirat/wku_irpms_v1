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
    //reset_code?: String;
    //reset_code_expires?: Date;
    status: UserStatus;
}



export class UserService {

    private static async prepareHash(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    };

    static async createUser(data: CreateUserDto) {
        const applicant = await Applicant.findOne({ email: data.email });
        if (applicant?.user) {
            throw new Error("This email is already associated with an applicant profile. Cannot create a new user.");
        }
        const hashed = await this.prepareHash(data.password);
        const createdUser = await User.create({ ...data, password: hashed });
        if (applicant) {
            applicant.user = createdUser._id as Types.ObjectId;
            await applicant.save();
        }
        const { password, ...rest } = createdUser.toObject();
        return { ...rest, linkedApplicant: !!applicant };
    }

    static async getUsers() {
        const users = await User.find({ isDeleted: { $ne: true } }, { password: 0 }).populate("roles").lean();
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
        //incase of overposting
        delete data.password;
        delete data.status;
        //
        Object.assign(user, data);
        const updatedUser = await user.save();
        const { password, ...rest } = updatedUser.toObject();
        return rest;
    }

    static async deleteUser(id: string) {
        const user = await User.findById(id);
        if (!user) throw new Error("User not found");
        if (user.status === UserStatus.Pending) {
            const applicant = await Applicant.findOne({ user: id });
            if (applicant) {
                applicant.user = undefined;
                await applicant.save();
            }
            return await user.deleteOne();
        }
        else {
            user.isDeleted = true;
            await user.save();
            return user;
        }
    }

    static async initAdminUser() {
        const userName = process.env.ADMIN_USER_NAME;
        const email = process.env.SYS_EMAIL;
        const password = process.env.ADMIN_PASSWORD;
        if (!userName || !email || !password) {
            throw new Error('Default Admin credentials are not found in environment variables.');
        }
        const exist = await User.exists({ user_name: userName });
        if (!exist) {
            const data: CreateUserDto = { user_name: userName, password: password, email: email, status: UserStatus.Active, roles: [] };
            await this.createUser(data);
            console.log('Default admin user created successfully.');
        }
    }
}

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
    status: UserStatus;
}



export class UserService {

    static async prepareHash(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    };

    static async createUser(data: CreateUserDto) {
        const hashed = await this.prepareHash(data.password);
        const createdUser = await User.create({ ...data, password: hashed });
        try {
            const linkedUser = await this.linkApplicant(createdUser._id as string);            
            return linkedUser;
        } catch (err) { }
        const { password, ...rest } = createdUser.toObject();
        return rest;
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
        Object.assign(user, data);
        const updatedUser = await user.save();
        const { password, ...rest } = updatedUser.toObject();
        return rest;
    }

    static async linkApplicant(id: string) {
        const user = await User.findById(id).select("-password").lean();
        if (!user) throw new Error("User not found");
        const applicant = await Applicant.findOne({ email: user.email });
        if (!applicant) throw new Error("Applicant not found");
        //if applicant.user  Change email is possible//
        if (applicant.user) throw new Error("Applicant already linked");
        applicant.user = new Types.ObjectId(id);
        await applicant.save();
        return { ...user, linkedApplicant: !!applicant };
    }

    static async deleteUser(id: string) {
        const user = await User.findById(id).select("-password");
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
            user.status = user.status === UserStatus.Active ? UserStatus.Suspended : UserStatus.Active;
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
            const data = { user_name: userName, password: password, email: email, status: UserStatus.Active, roles: [], isDeleted: true };
            await this.createUser(data);
            console.log('Default admin user created successfully.');
        }
    }
}

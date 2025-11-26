import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Applicant from "../applicants/applicant.model";
import { UserStatus } from "./user.enum";
import { User } from "./user.model";
import { Role } from "./roles/role.model";
import { IUserRepository, UserRepository } from "./user.repository";
import { CreateUserDTO } from "./user.dto";


export interface CreateUserDto {
    user_name: string;
    password: string;
    email: string;
    roles: mongoose.Types.ObjectId[];
    organizations?: mongoose.Types.ObjectId[];
    status: UserStatus;
}

export class ChangePasswordDto {
    oldPassword!: string;
    newPassword!: string;
}



export class UserService {

    private repository: IUserRepository;

    constructor(repository?: IUserRepository) {
        this.repository = repository || new UserRepository();
    }

    static async prepareHash(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    };

    async create(data: CreateUserDTO) {
        const hashed = await UserService.prepareHash(data.password);
        // Build the proper DTO for the repository
        const dto = {
            ...data,
            password: hashed,
            status: UserStatus.pending
        };
        const createdUser = await this.repository.create(dto);
        // Remove password before returning
        const { password, ...rest } = createdUser;
        return rest;
    }

    async getUsers(showDeleted?: boolean) {
        const users = await this.repository.findAll({ deleted: showDeleted });
        return users.map(({ password, ...rest }) => rest);
    }


    static async createUser(data: CreateUserDto) {
        const hashed = await this.prepareHash(data.password);
        const createdUser = await User.create({ ...data, password: hashed });
        const { password, ...rest } = createdUser.toObject();
        return rest;
    }

    static async getUsers() {
        const users = await User.find({ isDeleted: { $ne: true } }, { password: 0 }).
            populate("roles").populate("organizations").lean();
        return users;
    }

    static async updateUser(id: string, data: Partial<CreateUserDto>) {
        const user = await User.findById(id);
        if (!user) throw new Error("User not found");
        Object.assign(user, data);
        const updatedUser = await user.save();
        const { password, ...rest } = updatedUser.toObject();
        return rest;
    }

    static async deleteUser(id: string) {
        const user = await User.findById(id).select("-password");
        if (!user) throw new Error("User not found");

        if (user.status === UserStatus.deleted) {
            const applicant = await Applicant.findOne({ user: id });
            if (applicant) {
                throw new Error("Cannot delete user linked to an applicant");
            }
            await user.deleteOne();
            return { message: "User permanently deleted" };
        }

        user.status = UserStatus.deleted;
        await user.save();
        return { message: "User marked as deleted successfully" };
    }

    static async changePassword(id: string, dto: ChangePasswordDto) {
        const user = await User.findById(id);
        if (!user) throw new Error("User not found");

        const { oldPassword, newPassword } = dto;

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            throw new Error("Old password is incorrect");
        }
        user.password = await this.prepareHash(newPassword);
        await user.save();

        return { message: "Password changed successfully" };
    }


    static async resetPassword(id: string, newPassword: string) {
        const user = await User.findById(id);
        if (!user) throw new Error("User not found");

        user.password = await this.prepareHash(newPassword);
        await user.save();

        return { message: "Password reset successfully" };
    }


    static async initAdminUser() {
        const repository = new UserRepository();
        const userName = process.env.ADMIN_USER_NAME;
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;
        if (!userName || !email || !password) {
            throw new Error('Default Admin credentials are not found in environment variables.');
        }
        const exist = await repository.exists(userName);
        if (!exist) {
            const adminRole = await Role.findOne({ role_name: "admin" });
            if (!adminRole) {
                throw new Error("Admin role not initialized.");
            }
            const hashed = await this.prepareHash(password);
            const data = { user_name: userName, password: hashed, email: email, status: UserStatus.active, roles: [adminRole._id as string] };
            await repository.create(data);
            console.log('Default admin user created successfully.');
        }
    }
}

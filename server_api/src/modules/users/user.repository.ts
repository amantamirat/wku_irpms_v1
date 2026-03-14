import mongoose, { FilterQuery } from "mongoose";
import { User, IUser } from "./user.model";
import { CreateUserDTO, UpdateUserDTO } from "./user.dto";

export interface IUserRepository {
    create(data: CreateUserDTO): Promise<IUser>;
    findById(id: string): Promise<IUser | null>;
    findByEmail(email: string): Promise<IUser | null>;
    findAll(): Promise<Partial<IUser>[]>;
    update(id: string, data: UpdateUserDTO["data"]): Promise<IUser | null>;
    exists(filter: Partial<IUser>): Promise<boolean>;
    delete(id: string): Promise<void>;
}

export class UserRepository implements IUserRepository {

    async create(dto: CreateUserDTO) {
        const data: Partial<IUser> = {
            applicant: new mongoose.Types.ObjectId(dto.applicant),
            password: dto.password,
            email: dto.email,
            status: dto.status,
            //createdBy: new mongoose.Types.ObjectId(dto.createdBy)
        };
        const created = await User.create(data);
        return created.toObject();
    }


    async findById(id: string) {
        return User.findById(new mongoose.Types.ObjectId(id))
            .lean<IUser>()
            .exec();
    }

    async findByEmail(email: string): Promise<IUser | null> {
        return await User.findOne(
            { email }
        ).select('+password').lean();
    }

    async findAll() {
        const filter: any = {};
        return User.find(filter).populate("applicant")
            //.populate("roles").populate("organizations")
            .lean<IUser[]>()
            .exec();
    }

    async update(id: string, dtoData: UpdateUserDTO["data"]) {
        const toUpdate: any = {};

        if (dtoData.password) {
            toUpdate.password = dtoData.password;
        }
        if (dtoData.resetCode) {
            toUpdate.resetCode = dtoData.resetCode;
        }
        if (dtoData.resetCodeExpires) {
            toUpdate.resetCodeExpires = dtoData.resetCodeExpires;
        }
        if (dtoData.lastLogin) {
            toUpdate.lastLogin = dtoData.lastLogin;
        }
        if (dtoData.failedLoginAttempts) {
            toUpdate.failedLoginAttempts = dtoData.failedLoginAttempts;
        }

        if (dtoData.lockUntil) {
            toUpdate.lockUntil = dtoData.lockUntil;
        }

        if (dtoData.status) {
            toUpdate.status = dtoData.status;
        }

        return await User.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: toUpdate },
            { new: true }
        ).lean<IUser>();

    }

    async exists(filter: FilterQuery<IUser>): Promise<boolean> {
        const result = await User.exists(filter);
        return result !== null;
    }

    async delete(id: string) {
        await User.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}

import mongoose from "mongoose";
import { User, IUser } from "./user.model";
import { CreateUserDTO, UpdateUserDTO } from "./user.dto";

export interface IUserRepository {
    findById(id: string): Promise<IUser | null>;
    findAll(): Promise<Partial<IUser>[]>;
    findByEmail(email: string): Promise<IUser | null>;
    create(data: CreateUserDTO): Promise<IUser>;
    update(id: string, data: UpdateUserDTO["data"]): Promise<IUser | null>;
    delete(id: string): Promise<void>;
}

export class UserRepository implements IUserRepository {


    async findById(id: string) {
        return User.findById(new mongoose.Types.ObjectId(id))
            .lean<IUser>()
            .exec();
    }

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

    async findAll() {
        const filter: any = {};
        return User.find(filter).populate("applicant")
            //.populate("roles").populate("organizations")
            .lean<IUser[]>()
            .exec();
    }

    async findByEmail(email: string): Promise<IUser | null> {
        return await User.findOne(
            { email }
        ).select('+password').lean();
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


    async delete(id: string) {
        await User.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}

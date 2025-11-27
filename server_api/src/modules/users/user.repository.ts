import mongoose from "mongoose";
import { User, IUser } from "./user.model";
import { CreateUserDTO, GetUsersDTO, UpdateUserDTO } from "./user.dto";

export interface IUserRepository {
    findById(id: string): Promise<IUser | null>;
    findAll(options: GetUsersDTO): Promise<Partial<IUser>[]>;
    exists(userName: string): Promise<boolean>;
    create(data: CreateUserDTO): Promise<IUser>;
    update(id: string, data: UpdateUserDTO["data"]): Promise<IUser>;
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
            user_name: dto.user_name,
            password: dto.password,
            email: dto.email,
            roles: dto.roles?.map(id => new mongoose.Types.ObjectId(id)) ?? [],
            organizations: dto.organizations?.map(id => new mongoose.Types.ObjectId(id)) ?? [],
            status: dto.status,
            createdBy: new mongoose.Types.ObjectId(dto.createdBy)
        };

        return User.create(data);
    }

    async findAll(query: GetUsersDTO) {
        const { deleted } = query;

        const filter: any = {};
        // Only set the filter if deleted is defined
        if (deleted === true) {
            // Get only deleted users
            filter.isDeleted = true;
        } else {
            // Get NON-deleted users (including those without the field)
            filter.$or = [
                { isDeleted: false },
                { isDeleted: { $exists: false } }
            ];
        }

        return User.find(filter).populate("roles").populate("organizations")
            .lean<IUser[]>()
            .exec();
    }

    async exists(userName: string): Promise<boolean> {
        //throw new Error("Method not implemented.");
        const exists = await User.exists({ user_name: userName });
        return exists !== null; // true if exists, false otherwise
    }


    async update(id: string, dtoData: UpdateUserDTO["data"]) {
        const toUpdate: any = {};

        if (dtoData.roles) {
            toUpdate.roles = dtoData.roles.map(r => new mongoose.Types.ObjectId(r));
        }

        if (dtoData.organizations) {
            toUpdate.organizations = dtoData.organizations.map(o => new mongoose.Types.ObjectId(o));
        }

        if (dtoData.isDeleted) {
            toUpdate.isDeleted = dtoData.isDeleted;
        }

        if (dtoData.password) {
            toUpdate.password = dtoData.password;
        }

        const updated = await User.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: toUpdate },
            { new: true }
        ).lean<IUser>();

        if (!updated) {
            throw new Error("User not found.");
        }

        return updated;
    }


    async delete(id: string) {
        await User.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}

import mongoose from "mongoose";
import { User, IUser } from "./user.model";
import { CreateUserDTO, UpdateUserDTO } from "./user.dto";

export interface IUserRepository {
    findById(id: string): Promise<IUser | null>;
    findAll(): Promise<Partial<IUser>[]>;
    findByNameOrEmail(eName: string): Promise<IUser | null>;
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
            applicant: new mongoose.Types.ObjectId(dto.applicant),
            user_name: dto.user_name,
            password: dto.password,
            email: dto.email,
            //roles: dto.roles?.map(id => new mongoose.Types.ObjectId(id)) ?? [],
           // organizations: dto.organizations?.map(id => new mongoose.Types.ObjectId(id)) ?? [],
            status: dto.status,
            createdBy: new mongoose.Types.ObjectId(dto.createdBy)
        };
        const created = await User.create(data);
        return created.toObject();
    }

    async findAll() {
        const filter: any = {};
        return User.find(filter).populate("applicant")
        .populate("roles").populate("organizations")
            .lean<IUser[]>()
            .exec();
    }

    async findByNameOrEmail(eName: string): Promise<IUser | null> {
        //throw new Error("Method not implemented.");
        return await User.findOne({
            $or: [
                { email: eName },
                { user_name: eName }
            ]
        }).lean();
    }


    async update(id: string, dtoData: UpdateUserDTO["data"]) {
        const toUpdate: any = {};

        /**
         * 
         * if (dtoData.roles) {
            toUpdate.roles = dtoData.roles.map(r => new mongoose.Types.ObjectId(r));
        }

        if (dtoData.organizations) {
            toUpdate.organizations = dtoData.organizations.map(o => new mongoose.Types.ObjectId(o));
        }
         */       

        if (dtoData.status) {
            toUpdate.status = dtoData.status;
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

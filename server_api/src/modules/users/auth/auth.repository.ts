import mongoose from "mongoose";
import { Auth, IAuth } from "./auth.model";
import { CreateAuthDTO, UpdateAuthDTO } from "./auth.dto";

export interface IAuthRepository {
    findById(id: string): Promise<IAuth | null>;
    findAll(): Promise<Partial<IAuth>[]>;
    findByEmail(email: string): Promise<IAuth | null>;
    create(data: CreateAuthDTO): Promise<IAuth>;
    update(id: string, data: UpdateAuthDTO["data"]): Promise<IAuth | null>;
    delete(id: string): Promise<void>;
}

export class AuthRepository implements IAuthRepository {

    async findById(id: string) {
        return Auth.findById(new mongoose.Types.ObjectId(id))
            .lean<IAuth>()
            .exec();
    }

    async create(dto: CreateAuthDTO) {
        const data: Partial<IAuth> = {
            user: new mongoose.Types.ObjectId(dto.applicant),
            password: dto.password,
            email: dto.email,
            status: dto.status,
            //createdBy: new mongoose.Types.ObjectId(dto.createdBy)
        };
        const created = await Auth.create(data);
        return created.toObject();
    }

    async findAll() {
        const filter: any = {};
        return Auth.find(filter).populate("user")
            .lean<IAuth[]>()
            .exec();
    }

    async findByEmail(email: string): Promise<IAuth | null> {
        return await Auth.findOne(
            { email: email }
        ).lean();
    }


    async update(id: string, dtoData: UpdateAuthDTO["data"]) {
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

        if (dtoData.status) {
            toUpdate.status = dtoData.status;
        }

        const updated = Auth.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: toUpdate },
            { new: true }
        ).lean<IAuth>();

        return updated;
    }


    async delete(id: string) {
        await Auth.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}

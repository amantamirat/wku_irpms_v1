import mongoose, { FilterQuery } from "mongoose";
import { CreateAccountDTO, UpdateAccountDTO } from './account.dto';
import { IAccount, Account } from "./account.model";


export interface IAccountRepository {
    create(data: CreateAccountDTO): Promise<IAccount>;
    findById(id: string): Promise<IAccount | null>;
    findByEmail(email: string): Promise<IAccount | null>;
    findAll(): Promise<Partial<IAccount>[]>;
    update(id: string, data: UpdateAccountDTO["data"]): Promise<IAccount | null>;
    exists(filter: Partial<IAccount>): Promise<boolean>;
    delete(id: string): Promise<void>;
}

export class AccountRepository implements IAccountRepository {

    async create(dto: CreateAccountDTO) {
        const data: Partial<IAccount> = {
            applicant: new mongoose.Types.ObjectId(dto.applicant),
            password: dto.password,
            email: dto.email,
            status: dto.status,
            //createdBy: new mongoose.Types.ObjectId(dto.createdBy)
        };
        const created = await Account.create(data);
        return created.toObject();
    }


    async findById(id: string) {
        return Account.findById(new mongoose.Types.ObjectId(id))
            .select('+password')
            .lean<IAccount>()
            .exec();
    }

    async findByEmail(email: string): Promise<IAccount | null> {
        return await Account.findOne(
            { email }
        ).select('+password').lean();
    }

    async findAll() {
        const filter: any = {};
        return Account.find(filter).populate("applicant")
            //.populate("roles").populate("organizations")
            .lean<IAccount[]>()
            .exec();
    }

    async update(id: string, dtoData: UpdateAccountDTO["data"]) {
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

        return await Account.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: toUpdate },
            { new: true }
        ).lean<IAccount>();

    }

    async exists(filter: FilterQuery<IAccount>): Promise<boolean> {
        const result = await Account.exists(filter);
        return result !== null;
    }

    async delete(id: string) {
        await Account.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}

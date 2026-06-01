import { IVerification } from "./verification.model";
import mongoose from "mongoose";
import { Verification } from "./verification.model";
import { CreateVerificationDTO, UpdateVerificationDTO } from "./verification.dto";

export interface IVerificationRepository {
    findById(id: string): Promise<IVerification | null>;
    findByGrant(grantId: string): Promise<IVerification[]>;
    findAll(): Promise<IVerification[]>;
    create(data: CreateVerificationDTO): Promise<IVerification>;
    update(id: string, data: UpdateVerificationDTO): Promise<IVerification | null>;
    delete(id: string): Promise<IVerification | null>;
}



export class VerificationRepository implements IVerificationRepository {

    async findById(id: string): Promise<IVerification | null> {
        return Verification.findById(new mongoose.Types.ObjectId(id))
            .lean<IVerification>()
            .exec();
    }

    async findByGrant(grantId: string): Promise<IVerification[]> {
        return Verification.find({
            grant: new mongoose.Types.ObjectId(grantId)
        })
            .lean<IVerification[]>()
            .exec();
    }

    async findAll(): Promise<IVerification[]> {
        return Verification.find()
            .lean<IVerification[]>()
            .exec();
    }

    async create(dto: CreateVerificationDTO): Promise<IVerification> {
        const data: Partial<IVerification> = {
            grant: new mongoose.Types.ObjectId(dto.grant),
            deadline: dto.deadline
        };

        return Verification.create(data);
    }

    async update(
        id: string,
        data: UpdateVerificationDTO
    ): Promise<IVerification | null> {
        return Verification.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: data },
            { new: true }
        )
            .lean<IVerification>()
            .exec();
    }

    async delete(id: string): Promise<IVerification | null> {
        return Verification.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        )
            .lean<IVerification>()
            .exec();
    }
}
import mongoose, { FilterQuery } from "mongoose";
import {
    IVerification,
    Verification,
    VerificationStatus
} from "./verification.model";

export interface CreateVerificationData {
    project: string;
    documentPath: string;
    submittedBy: string;
    configuration: string;
    attempt: number;
    status: VerificationStatus;
}

export interface IVerificationRepository {

    create(
        data: Partial<CreateVerificationData>
    ): Promise<IVerification>;

    findById(
        id: string
    ): Promise<IVerification | null>;

    find(
        filters?: FilterQuery<IVerification>
    ): Promise<IVerification[]>;

    update(
        id: string,
        data: Partial<IVerification>
    ): Promise<IVerification | null>;

    delete(
        id: string
    ): Promise<IVerification | null>;
}

export class VerificationRepository
    implements IVerificationRepository {

    async create(
        data: CreateVerificationData
    ): Promise<IVerification> {

        return Verification.create({

            project:
                new mongoose.Types.ObjectId(
                    data.project
                ),

            configuration:
                new mongoose.Types.ObjectId(
                    data.configuration
                ),

            submittedBy:
                new mongoose.Types.ObjectId(
                    data.submittedBy
                ),

            attempt:
                data.attempt,

            status:
                data.status,

            documentPath:
                data.documentPath,

            submittedAt:
                new Date()
        });
    }

    async findById(
        id: string
    ): Promise<IVerification | null> {

        return Verification
            .findById(id)
            .populate("project")
            .populate("configuration")
            .populate("submittedBy");
    }

    async find(
        filters: FilterQuery<IVerification> = {}
    ): Promise<IVerification[]> {

        return Verification
            .find(filters)
            .populate("project")
            .populate("configuration")
            .populate("submittedBy")
            .sort({
                attempt: 1
            });
    }

    async update(
        id: string,
        data: Partial<IVerification>
    ): Promise<IVerification | null> {

        return Verification.findByIdAndUpdate(
            id,
            {
                $set: data
            },
            {
                new: true,
                runValidators: true
            }
        );
    }

    async delete(
        id: string
    ): Promise<IVerification | null> {
        return Verification.findByIdAndDelete(id);
    }
}
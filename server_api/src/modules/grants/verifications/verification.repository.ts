import mongoose, { FilterQuery } from "mongoose";
import {
    IVerification,
    Verification,
    VerificationStatus
} from "./verification.model";
import { FindOptions } from "../../../common/dtos/filter.dto";


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
        id: string, options?: FindOptions
    ): Promise<IVerification | null>;

    findOneByAttempt(
        projectId: string,
        attempt: number
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
        id: string,
        options?: FindOptions
    ): Promise<IVerification | null> {

        const query = Verification.findById(id);

        if (options?.populate) {
            query
                .populate("project")
                .populate("configuration")
                .populate("submittedBy");
        }

        return query;
    }

    async findOneByAttempt(
        projectId: string,
        attempt: number
    ): Promise<IVerification | null> {

        return Verification
            .findOne({
                project: new mongoose.Types.ObjectId(projectId),
                attempt
            })
        //.populate("project")
        //.populate("configuration")
        //.populate("submittedBy");
    };

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
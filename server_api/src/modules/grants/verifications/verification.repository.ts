import mongoose, { FilterQuery } from "mongoose";
import {
    IVerification,
    Verification,
    VerificationStatus
} from "./verification.model";
import { FilterOptions } from "../../../common/dtos/filter.dto";
import { FilterVerification } from "./verification.dto";


export interface CreateVerificationData {
    project: string;
    documentPath: string;
    configuration: string;
    attempt: number;
    status: VerificationStatus;
}





export interface IVerificationRepository {

    create(
        data: Partial<CreateVerificationData>
    ): Promise<IVerification>;

    findById(
        id: string,
        options?: FilterOptions
    ): Promise<IVerification | null>;

    findOneByAttempt(
        projectId: string,
        attempt: number
    ): Promise<IVerification | null>;

    find(
        filters?: FilterVerification,
        options?: FilterOptions,
        scopeFilter?: Record<string, unknown>
    ): Promise<IVerification[]>;

    count(
        filters?: FilterVerification
    ): Promise<number>;

    update(
        id: string,
        data: Partial<IVerification>
    ): Promise<IVerification | null>;

    updateStatus(
        id: string,
        status: VerificationStatus,
        changedBy: string
    ): Promise<IVerification | null>;

    exists(
        filter: FilterVerification
    ): Promise<boolean>

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

            attempt:
                data.attempt,

            status:
                data.status,

            documentPath:
                data.documentPath
        });
    }


    // --------------------------------------------------
    // FIND BY ID
    // --------------------------------------------------

    async findById(
        id: string,
        options?: FilterOptions
    ): Promise<IVerification | null> {

        const query =
            Verification.findById(id);

        if (options?.populate) {

            query
                .populate("project")
                .populate("configuration");
        }

        return query;
    }


    // --------------------------------------------------
    // FIND BY ATTEMPT
    // --------------------------------------------------

    async findOneByAttempt(
        projectId: string,
        attempt: number
    ): Promise<IVerification | null> {

        return Verification
            .findOne({
                project:
                    new mongoose.Types.ObjectId(
                        projectId
                    ),
                attempt
            })
            .populate("project")
            .populate("configuration");
    }


    // --------------------------------------------------
    // FIND
    // --------------------------------------------------

    async find(
        filters: FilterVerification = {},
        options?: FilterOptions,
        scopeFilter?: Record<string, unknown>
    ): Promise<IVerification[]> {

        const filter: FilterQuery<IVerification> = {};


        if (filters.project) {
            filter.project =
                new mongoose.Types.ObjectId(
                    filters.project
                );
        }

        if (filters.configuration) {
            filter.configuration =
                new mongoose.Types.ObjectId(
                    filters.configuration
                );
        }

        if (filters.attempt !== undefined) {
            filter.attempt =
                filters.attempt;
        }

        if (filters.status) {
            filter.status =
                Array.isArray(filters.status)
                    ? { $in: filters.status }
                    : filters.status;
        }

        const query = scopeFilter
            ? { $and: [scopeFilter, filter] }
            : filter;


        const data =
            Verification
                .find(query)
                .sort({
                    createdAt: -1
                });

        if (options?.populate) {

            data
                .populate("project")
                .populate("configuration");
        }

        return data;
    }


    // --------------------------------------------------
    // COUNT
    // --------------------------------------------------

    async count(
        filters: FilterVerification = {}
    ): Promise<number> {

        const filter: FilterQuery<IVerification> = {};

        if (filters.project) {
            filter.project =
                new mongoose.Types.ObjectId(
                    filters.project
                );
        }

        if (filters.configuration) {
            filter.configuration =
                new mongoose.Types.ObjectId(
                    filters.configuration
                );
        }

        if (filters.attempt !== undefined) {
            filter.attempt =
                filters.attempt;
        }

        if (filters.status) {
            filter.status =
                Array.isArray(filters.status)
                    ? { $in: filters.status }
                    : filters.status;
        }

        return Verification.countDocuments(
            filter
        );
    }


    // --------------------------------------------------
    // UPDATE
    // --------------------------------------------------

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


    async exists(
        filter: FilterVerification
    ): Promise<boolean> {

        const result = await Verification.exists(filter);

        return result !== null;
    }


    // --------------------------------------------------
    // UPDATE STATUS
    // --------------------------------------------------

    async updateStatus(
        id: string,
        status: VerificationStatus,
        userId: string
    ): Promise<IVerification | null> {

        return Verification.findByIdAndUpdate(
            id,
            {
                $set: {
                    status
                },
                $push: {
                    statusHistory: {
                        status,
                        changedBy:
                            new mongoose.Types.ObjectId(
                                userId
                            ),
                        changedAt: new Date()
                    }
                }
            },
            {
                new: true,
                runValidators: true
            }
        );
    }


    // --------------------------------------------------
    // DELETE
    // --------------------------------------------------

    async delete(
        id: string
    ): Promise<IVerification | null> {

        return Verification.findByIdAndDelete(
            id
        );
    }
}
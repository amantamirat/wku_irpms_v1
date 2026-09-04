import { FilterOptions } from "../../../common/dtos/filter.dto";
import {
    CreateVerificationConfigurationDTO,
    UpdateVerificationConfigurationDTO,
    FilterConfigurationDTO
} from "./verification-conf.dto";

import {
    IVerificationConfiguration,
    VerificationConfiguration
} from "./verification-conf.model";


export interface IVerificationConfigurationRepository {

    create(
        data: CreateVerificationConfigurationDTO
    ): Promise<IVerificationConfiguration>;

    findById(
        id: string,
        options?: FilterOptions
    ): Promise<IVerificationConfiguration | null>;

    findOneByGrant(grantId: string): Promise<IVerificationConfiguration | null>;

    find(
        filter: FilterConfigurationDTO,
        options?: FilterOptions
    ): Promise<IVerificationConfiguration[]>;

    /*
    findAll(
        options?: FilterOptions
    ): Promise<IVerificationConfiguration[]>;*/

    findUpcoming(
        options?: FilterOptions
    ): Promise<IVerificationConfiguration[]>;

    update(
        id: string,
        data: UpdateVerificationConfigurationDTO,
        options?: FilterOptions
    ): Promise<IVerificationConfiguration | null>;

    delete(
        id: string
    ): Promise<IVerificationConfiguration | null>;
}


export class VerificationConfigurationRepository
    implements IVerificationConfigurationRepository {

    /**
     * Create verification configuration
     */
    async create(
        data: CreateVerificationConfigurationDTO
    ): Promise<IVerificationConfiguration> {

        return VerificationConfiguration.create({
            grant: data.grant,
            deadline: data.deadline,
            template: data.template,
            evaluation: data.evaluation,
            minReviewers: data.minReviewers,
            maxReviewers: data.maxReviewers,
            maxAttempts: data.maxAttempts,
            minAcceptanceScore: data.minAcceptanceScore,
            status: data.status
        });
    }


    /**
     * Find verification configuration by ID
     */
    async findById(
        id: string,
        options?: FilterOptions
    ): Promise<IVerificationConfiguration | null> {

        let query = VerificationConfiguration.findById(id);

        if (options?.populate) {
            query = query
                .populate("grant")
                .populate("template");
        }

        return query;
    }


    async findOneByGrant(grantId: string, options?: FilterOptions): Promise<IVerificationConfiguration | null> {

        let query = VerificationConfiguration.findOne({ grant: grantId });

        if (options?.populate) {
            query = query
                //.populate("grant")
                .populate("template");
        }
        return query;
    }


    /**
     * Find verification configurations using filters
     */
    async find(
        filter: FilterConfigurationDTO,
        options?: FilterOptions
    ): Promise<IVerificationConfiguration[]> {

        const query: Record<string, unknown> = {};

        if (filter.deadline) {
            query.deadline = filter.deadline;
        }

        if (filter.status) {
            query.status = filter.status;
        }

        let mongooseQuery = VerificationConfiguration
            .find(query)
            .sort({ createdAt: -1 });

        if (options?.populate) {
            mongooseQuery = mongooseQuery
                .populate({
                    path: "grant",
                    populate: {
                        path: "organization"
                    }
                })
                .populate("template");
        }

        return mongooseQuery;
    }





    /**
     * Find upcoming verification configurations
     */
    async findUpcoming(
        options?: FilterOptions
    ): Promise<IVerificationConfiguration[]> {

        let query = VerificationConfiguration
            .find({
                deadline: {
                    $gt: new Date()
                }
            })
            .sort({ deadline: 1 });

        if (options?.populate) {
            query = query
                .populate({
                    path: "grant",
                    populate: {
                        path: "organization"
                    }
                })
            //.populate("template");
        }
        return query;
    }


    /**
     * Update verification configuration
     */
    async update(
        id: string,
        data: UpdateVerificationConfigurationDTO,
        options?: FilterOptions
    ): Promise<IVerificationConfiguration | null> {

        let query = VerificationConfiguration.findByIdAndUpdate(
            id,
            {
                $set: data
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (options?.populate) {
            query = query
                .populate("grant")
                .populate("template");
        }

        return query;
    }


    /**
     * Delete verification configuration
     */
    async delete(
        id: string
    ): Promise<IVerificationConfiguration | null> {

        return VerificationConfiguration.findByIdAndDelete(id);
    }
}
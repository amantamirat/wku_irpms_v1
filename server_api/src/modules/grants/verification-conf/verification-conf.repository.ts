
import { CreateVerificationConfigurationDTO, UpdateVerificationConfigurationDTO } from "./verification-conf.dto";
import { IVerificationConfiguration, VerificationConfiguration } from "./verification-conf.model";

export interface IVerificationConfigurationRepository {

    create(
        data: CreateVerificationConfigurationDTO
    ): Promise<IVerificationConfiguration>;

    findById(
        id: string
    ): Promise<IVerificationConfiguration | null>;


    findByGrant(
        grantId: string
    ): Promise<IVerificationConfiguration | null>;

    findAll(): Promise<IVerificationConfiguration[]>;
    findUpcoming(): Promise<IVerificationConfiguration[]>
    update(
        id: string,
        data: UpdateVerificationConfigurationDTO
    ): Promise<IVerificationConfiguration | null>;

    delete(
        id: string
    ): Promise<IVerificationConfiguration | null>;
}


export class VerificationConfigurationRepository
    implements IVerificationConfigurationRepository {

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

    async findById(
        id: string
    ): Promise<IVerificationConfiguration | null> {

        return VerificationConfiguration
            .findById(id)
            .populate("grant")
        //.populate("template");
    }


    async findByGrant(
        grantId: string
    ): Promise<IVerificationConfiguration | null> {

        return VerificationConfiguration
            .findOne({
                grant: grantId
            })
        //.populate("grant")
        //.populate("template");
    }


    async findAll(): Promise<IVerificationConfiguration[]> {

        return VerificationConfiguration
            .find()
            .populate("grant")
            .populate("template")
            .sort({ createdAt: -1 });
    }

    async findUpcoming(): Promise<IVerificationConfiguration[]> {

        return VerificationConfiguration
            .find({
                deadline: {
                    $gt: new Date()
                }
            })
            .populate({
                path: "grant",
                populate: {
                    path: "organization"
                }
            })
            //.populate("template")
            .sort({ deadline: 1 });
    }

    async update(
        id: string,
        data: UpdateVerificationConfigurationDTO
    ): Promise<IVerificationConfiguration | null> {

        return VerificationConfiguration.findByIdAndUpdate(
            id,
            {
                $set: data
            },
            {
                new: true,
                runValidators: true
            }
        )
            .populate("grant")
            .populate("template");
    }

    async delete(
        id: string
    ): Promise<IVerificationConfiguration | null> {

        return VerificationConfiguration.findByIdAndDelete(id);
    }
}
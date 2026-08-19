import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import {
    CreateVerificationConfigurationDTO,
    UpdateVerificationConfigurationDTO
} from "./verification-conf.dto";
import {
    IVerificationConfiguration
} from "./verification-conf.model";
import {
    IVerificationConfigurationRepository
} from "./verification-conf.repository";

export class VerificationConfigurationService {

    constructor(
        private readonly repository:
            IVerificationConfigurationRepository
    ) { }

    async create(
        dto: CreateVerificationConfigurationDTO
    ): Promise<IVerificationConfiguration> {

        // One configuration per grant
        const existing =
            await this.repository.findByGrant(dto.grant);

        if (existing) {
            throw new AppError(
                ERROR_CODES.VERIFICATION_CONFIGURATION_ALREADY_EXISTS
            );
        }

        this.validateReviewers(
            dto.minReviewers,
            dto.maxReviewers
        );

        this.validateDeadline(dto.deadline);

        return this.repository.create(dto);
    }

    async getById(
        id: string
    ): Promise<IVerificationConfiguration> {

        const configuration =
            await this.repository.findById(id);

        if (!configuration) {
            throw new AppError(
                ERROR_CODES.VERIFICATION_CONFIGURATION_NOT_FOUND
            );
        }

        return configuration;
    }

    /*
    async getByGrant(
        grantId: string
    ): Promise<IVerificationConfiguration> {

        const configuration =
            await this.repository.findByGrant(grantId);

        if (!configuration) {
            throw new AppError(
                ERROR_CODES.VERIFICATION_CONFIGURATION_NOT_FOUND
            );
        }

        return configuration;
    }*/

    async getAll(): Promise<IVerificationConfiguration[]> {
        return this.repository.findAll();
    }

    async getUpcoming(): Promise<IVerificationConfiguration[]> {
        return this.repository.findUpcoming();
    }

    async update(
        id: string,
        dto: UpdateVerificationConfigurationDTO
    ): Promise<IVerificationConfiguration> {

        const existing =
            await this.repository.findById(id);

        if (!existing) {
            throw new AppError(
                ERROR_CODES.VERIFICATION_CONFIGURATION_NOT_FOUND
            );
        }

        const minReviewers =
            dto.minReviewers ?? existing.minReviewers;

        const maxReviewers =
            dto.maxReviewers ?? existing.maxReviewers;

        this.validateReviewers(
            minReviewers,
            maxReviewers
        );

        if (dto.deadline !== undefined) {
            this.validateDeadline(dto.deadline);
        }

        const updated =
            await this.repository.update(id, dto);

        if (!updated) {
            throw new AppError(
                ERROR_CODES.VERIFICATION_CONFIGURATION_NOT_FOUND
            );
        }

        return updated;
    }

    async delete(id: string): Promise<void> {

        const existing =
            await this.repository.findById(id);

        if (!existing) {
            throw new AppError(
                ERROR_CODES.VERIFICATION_CONFIGURATION_NOT_FOUND
            );
        }

        await this.repository.delete(id);
    }

    private validateReviewers(
        minReviewers: number,
        maxReviewers: number
    ): void {

        if (minReviewers < 1 || maxReviewers < 1) {
            throw new AppError(
                ERROR_CODES.INVALID_VERIFICATION_REVIEWERS
            );
        }

        if (minReviewers > maxReviewers) {
            throw new AppError(
                ERROR_CODES.MIN_REVIEWERS_GREATER_THAN_MAX
            );
        }
    }

    private validateDeadline(deadline: Date | string): void {
        const date = new Date(deadline);

        if (isNaN(date.getTime())) {
            throw new AppError(
                ERROR_CODES.INVALID_VERIFICATION_DEADLINE
            );
        }
    }
}
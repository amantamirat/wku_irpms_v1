import { FilterOptions } from "../../../common/dtos/filter.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { IVerificationRepository } from "../verifications/verification.repository";
import {
    CreateVerificationConfigurationDTO,
    FilterConfigurationDTO,
    UpdateVerificationConfigurationDTO
} from "./verification-conf.dto";
import {
    IVerificationConfiguration,
    VerificationConfigurationStatus
} from "./verification-conf.model";
import {
    IVerificationConfigurationRepository
} from "./verification-conf.repository";

export class VerificationConfigurationService {

    constructor(
        private readonly repository:
            IVerificationConfigurationRepository,
        private readonly verificationRepo:
            IVerificationRepository
    ) { }

    async create(
        dto: CreateVerificationConfigurationDTO, userId: string
    ): Promise<IVerificationConfiguration> {

        // One configuration per grant
        const existing =
            await this.repository.findOneByGrant(dto.grant);

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

        return this.repository.create(dto, userId);
    }

    async getById(
        id: string, options?: FilterOptions
    ): Promise<IVerificationConfiguration> {

        const configuration =
            await this.repository.findById(id, options);

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

    async get(filter: FilterConfigurationDTO, options: FilterOptions): Promise<IVerificationConfiguration[]> {
        return this.repository.find(filter, options);
    }

    async getUpcoming(options?: FilterOptions): Promise<IVerificationConfiguration[]> {
        return this.repository.findUpcoming(options);
    }

    async update(
        id: string,
        dto: UpdateVerificationConfigurationDTO,
        userId: string
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
            await this.repository.update(id, dto, userId, { populate: true });

        if (!updated) {
            throw new AppError(
                ERROR_CODES.VERIFICATION_CONFIGURATION_NOT_FOUND
            );
        }

        return updated;
    }


    async transitionState(dto: TransitionRequestDto, userId: string) {
        const { id, current, next } = dto;

        const configuration = await this.repository.findById(id);

        if (!configuration) {
            throw new AppError(ERROR_CODES.VERIFICATION_CONFIGURATION_NOT_FOUND);
        }

        const from = configuration.status as VerificationConfigurationStatus;
        const to = next as VerificationConfigurationStatus;

        // Optional UI consistency check
        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        TransitionHelper.validateTransition(
            from,
            to,
            VERIFICATION_CONFIGURATION_TRANSITIONS
        );

        return await this.repository.updateStatus(
            id,
            to,
            userId
        );
    }

    async delete(id: string): Promise<void> {
        const existing = await this.repository.findById(id);

        if (!existing) {
            throw new AppError(
                ERROR_CODES.VERIFICATION_CONFIGURATION_NOT_FOUND
            );
        }

        const verificationExists = await this.verificationRepo.exists({
            configuration: id
        });

        if (verificationExists) {
            throw new AppError(
                ERROR_CODES.VERIFICATION_ALREADY_EXISTS
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


export const VERIFICATION_CONFIGURATION_TRANSITIONS: Record<
    VerificationConfigurationStatus,
    VerificationConfigurationStatus[]
> = {
    [VerificationConfigurationStatus.active]: [
        VerificationConfigurationStatus.closed
    ],

    [VerificationConfigurationStatus.closed]: [
        VerificationConfigurationStatus.active
    ]
};
// reviewer.service.ts
import { FilterOptions } from "../../common/dtos/filter.dto";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { AuthScope } from "../auth/auth.types";
import ScopeFilterService from "../auth/scope-filter.service";
import { FormType } from "../evaluations/criteria/criterion.model";
import { ICriterionRepository } from "../evaluations/criteria/criterion.repository";
import { NotificationService } from "../notifications/notification.service";
import { IResultRepository } from "./results/result.repository";
import { CreateReviewerDTO, FilterReviewersDto, UpdateReviewerDTO } from "./reviewer.dto";
import { IReviewer, ReviewerTargetType } from "./reviewer.model";
import { PreparedReviewer, ReviewerPolicy } from "./reviewer.policy";
import { IReviewerRepository } from "./reviewer.repository";
import { REVIEWER_TRANSITIONS, ReviewerStatus } from "./reviewer.state-machine";

export class ReviewerService {

    constructor(
        private readonly reviewerRepo: IReviewerRepository,
        private readonly resultRepo: IResultRepository,
        private readonly criterionRepo: ICriterionRepository,
        //private readonly stageRepo: IStageRepository,
        private readonly policy: ReviewerPolicy,
        private readonly notificationService: NotificationService,
        private readonly scopeFilterService: ScopeFilterService
    ) {
    }

    async create(dto: CreateReviewerDTO, userId: string) {
        const { targetType, application, verification, reviewer, weight } = dto;

        let prepared: PreparedReviewer;

        if (targetType === ReviewerTargetType.APPLICATION) {
            if (!application)
                throw new AppError(ERROR_CODES.APPLICATION_NOT_FOUND);

            prepared = await this.policy.prepareApplicationReviewer(
                application, reviewer, userId);


        } else if (targetType === ReviewerTargetType.VERIFICATION) {
            if (!verification)
                throw new AppError(ERROR_CODES.VERIFICATION_NOT_FOUND);

            prepared = await this.policy.prepareVerificationReviewer(
                verification, reviewer, userId);

        } else {
            throw new AppError(
                ERROR_CODES.INVALID_REVIEWER
            );
        }
        // Add values coming from DTO
        prepared.data.weight = weight;
        try {

            const created = await this.reviewerRepo.create({ ...prepared.data, createdBy: userId });

            await this.notificationService.notifyReviewerAssigned(
                reviewer, prepared.projectDoc.title,
                prepared.contextName,
            );
            return created;

        } catch (err: any) {

            if (err?.code === 11000) {
                console.error("Duplicate key error:");
                console.error("Message:", err.message);
                console.error("Key pattern:", err.keyPattern);
                console.error("Key value:", err.keyValue);
                console.error("Index:", err.index);
                console.error("Full error:", err);
                throw new AppError(
                    ERROR_CODES.REVIEWER_ALREADY_EXISTS
                );
            }

            throw err;
        }
    }

    getMyEvaluations = async (
        userId: string,
        filter?: Partial<FilterReviewersDto>,
        options?: FilterOptions
    ) => {
        return this.reviewerRepo.find(
            {
                ...filter,
                reviewer: userId
            },
            {
                ...options,
                populate: true
            }
        );
    };


    async read(filter: FilterReviewersDto, scope: AuthScope, options?: FilterOptions) {
        const scopeFilter =
            await this.scopeFilterService.getReviewerFilter(scope);
        return this.reviewerRepo.find(filter, options, scopeFilter);
    }

    async getReviewers(filter: FilterReviewersDto, options?: FilterOptions) {
        return this.reviewerRepo.find(filter, options);
    }

    // --- Update reviewer data (weight) ---
    async update(dto: UpdateReviewerDTO, userId: string) {
        const { id, data } = dto;
        const { weight } = data;
        const reviewerDoc = await this.reviewerRepo.findById(id);
        if (!reviewerDoc) throw new Error(ERROR_CODES.REVIEWER_NOT_FOUND);
        if (reviewerDoc.status !== ReviewerStatus.pending) {
            throw new Error(ERROR_CODES.REVIEWER_NOT_PENDING);
        }
        if (!weight || (weight === 0 || weight < 0))
            throw new Error(ERROR_CODES.INVALID_REVIEWER_WEIGHT);

        const updated = await this.reviewerRepo.update(id, { weight });
        return updated;
    }

    async transitionState(dto: TransitionRequestDto, userId: string) {
        const { id, current, next } = dto;

        const reviewerDoc = await this.reviewerRepo.findById(id);

        if (!reviewerDoc) {
            throw new AppError(ERROR_CODES.REVIEWER_NOT_FOUND);
        }

        const from = reviewerDoc.status as ReviewerStatus;
        const to = next as ReviewerStatus;

        // Prevent stale client state
        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        // Validate state-machine transition
        TransitionHelper.validateTransition(
            from,
            to,
            REVIEWER_TRANSITIONS
        );

        const transition = `${from}->${to}`;

        switch (transition) {
            case `${ReviewerStatus.pending}->${ReviewerStatus.verified}`:
                await this.acceptReviewer(reviewerDoc, userId);
                break;

            case `${ReviewerStatus.verified}->${ReviewerStatus.pending}`:
                await this.resultRepo.deleteByReviewer(id);
                break;

            case `${ReviewerStatus.verified}->${ReviewerStatus.submitted}`:
                await this.submitReviewer(reviewerDoc, userId);
                break;

            case `${ReviewerStatus.submitted}->${ReviewerStatus.verified}`:
                await this.reviewerRepo.update(id, { score: null });
                break;

            case `${ReviewerStatus.submitted}->${ReviewerStatus.accepted}`:
                break;

            case `${ReviewerStatus.accepted}->${ReviewerStatus.submitted}`:
                break;
        }

        const updated = await this.reviewerRepo.updateStatus(id, to, userId);

        //let targetDoc;

        // if (from === ReviewerStatus.accepted || to === ReviewerStatus.accepted) {
        await this.recalculateTargetScore(reviewerDoc, userId);
        //}

        return updated;
        // return { reviewerDoc: updated, targetDoc: targetDoc };
    }

    private async acceptReviewer(
        reviewerDoc: IReviewer,
        userId: string
    ): Promise<void> {
        if (String(reviewerDoc.reviewer) !== userId) {
            throw new AppError(ERROR_CODES.UNAUTHORIZED);
        }

        const existingResults = await this.resultRepo.find({
            reviewer: String(reviewerDoc._id)
        });

        if (existingResults.length > 0) {
            return;
        }

        const criteria = await this.criterionRepo.find({
            evaluation: String(reviewerDoc.evaluation)
        });

        if (criteria.length === 0) {
            return;
        }

        await this.resultRepo.insertMany(
            criteria.map(criterion => ({
                reviewer: String(reviewerDoc._id),
                criterion: String(criterion._id),
                score: null
            }))
        );
    }

    private async submitReviewer(
        reviewerDoc: IReviewer,
        userId: string
    ): Promise<void> {
        if (String(reviewerDoc.reviewer) !== userId) {
            throw new AppError(ERROR_CODES.UNAUTHORIZED);
        }

        const results = await this.resultRepo.find(
            {
                reviewer: String(reviewerDoc._id)
            },
            {
                populate: true
            }
        );

        const incomplete = results.some(result => {
            const criterion = result.criterion as any;

            if (criterion?.formType === FormType.OPEN) {
                return false;
            }

            return result.score === null ||
                result.score === undefined;
        });

        if (incomplete) {
            throw new AppError(ERROR_CODES.INCOMPELTE_CRITERIA);
        }

        const score = results.reduce(
            (total, result) => total + (result.score ?? 0),
            0
        );

        await this.reviewerRepo.update(
            String(reviewerDoc._id),
            { score }
        );
    }


    private async recalculateTargetScore(
        reviewerDoc: IReviewer, userId: string
    ): Promise<any> {
        switch (reviewerDoc.targetType) {
            case ReviewerTargetType.APPLICATION:
                return await this.policy.calculateApplicationScore(
                    String(reviewerDoc.application), userId
                );
            case ReviewerTargetType.VERIFICATION:
                return await this.policy.calculateVerificationScore(
                    String(reviewerDoc.verification)
                );
        }
    }

    async delete(id: string) {
        const reviewerDoc = await this.reviewerRepo.findById(id);

        if (!reviewerDoc) throw new AppError(ERROR_CODES.REVIEWER_NOT_FOUND);

        // Deny deletion if a result already exists
        const resultExists = await this.resultRepo.exists({
            reviewer: id
        });

        if (resultExists)
            throw new AppError(ERROR_CODES.RESULT_ALREADY_EXISTS);


        const deleted = await this.reviewerRepo.delete(id);

        return deleted
    }
}

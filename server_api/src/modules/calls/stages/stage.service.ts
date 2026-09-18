import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { IEvaluationRepository } from "../../evaluations/evaluation.repository";
import { ResourceStatus } from "../../evaluations/evaluation.state-machine";
import { ICallRepository } from "../call.repository";
import { CreateStageDTO, FilterStageDto, UpdateStageDTO } from "./stage.dto";
import { CallStatus } from "../call.model";
import { IStageRepository } from "./stage.repository";
import { IStage, StageStatus } from "./stage.model";
import { FilterOptions } from "../../../common/dtos/filter.dto";
import { IApplicationRepository } from "../../projects/applications/application.repository";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";

export class StageService {

    constructor(
        private readonly repository: IStageRepository,
        private readonly callRepository: ICallRepository,
        private readonly evalRepository: IEvaluationRepository,
        private readonly applicationRepo: IApplicationRepository,
    ) {
    }


    async validateCall(callId: string) {
        const callDoc = await this.callRepository.findById(callId);
        if (!callDoc) throw new Error(ERROR_CODES.CALL_NOT_FOUND);
        if (callDoc.status !== CallStatus.planned)
            throw new AppError(ERROR_CODES.CALL_NOT_PLANNED);
        return callDoc;
    }

    async syncCallDeadline(callId: string, userId: string) {
        const firstStage = await this.repository.getFirstStage(callId);
        return this.callRepository.update(callId, {
            deadline: firstStage?.deadline ?? null,
        }, userId);
    }


    async validateCreate(dto: CreateStageDTO): Promise<void> {
        const {
            call,
            evaluation,
            minReviewers,
            maxReviewers,
            minAcceptanceScore
        } = dto;

        // Reviewer validation
        if (minReviewers > maxReviewers) {
            throw new AppError(ERROR_CODES.INVALID_REVIEWER_RANGE);
        }

        if (call !== "validation")
            await this.validateCall(call);

        // Evaluation validation
        const evalDoc = await this.evalRepository.findById(evaluation);

        if (!evalDoc) {
            throw new AppError(ERROR_CODES.EVALUATION_NOT_FOUND);
        }

        if (evalDoc.status !== ResourceStatus.published) {
            throw new AppError(ERROR_CODES.EVALUATION_NOT_PUBLISHED);
        }

        // Acceptance score validation
        if (minAcceptanceScore > evalDoc.weight) {
            throw new AppError(
                ERROR_CODES.MIN_SCORE_EXCEEDS_EVALUATION_WEIGHT
            );
        }
    }

    /**
     * Create a new stage
     */
    async create(dto: CreateStageDTO, userId: string) {
        await this.validateCreate(dto);
        try {
            const lastStage = await this.repository.getLastStage(dto.call);

            const order = lastStage
                ? lastStage.order + 1
                : 1;

            const stage = await this.repository.create({
                ...dto,
                order
            }, userId);


            if (!lastStage) {
                await this.syncCallDeadline(dto.call, userId);
            }

            return stage;

        } catch (err: any) {
            if (err?.code === 11000) {
                /*
                console.error("Duplicate key error:");
                console.error("Message:", err.message);
                console.error("Key pattern:", err.keyPattern);
                console.error("Key value:", err.keyValue);
                console.error("Index:", err.index);
                console.error("Full error:", err);*/
                throw new AppError(
                    ERROR_CODES.STAGE_ALREADY_EXISTS
                );
            }

            throw err;
        }
    }
    /**
     * Get all stages or by call
     */
    async get(dto: FilterStageDto, options?: FilterOptions) {
        return await this.repository.find(dto, options);
    }

    async getAvailable(options?: FilterOptions): Promise<IStage[]> {
        return this.repository.findAvailable(options);
    }


    async getById(id: string) {
        const stage = await this.repository.findById(id);
        if (!stage) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
        return stage;
    }

    /*
    async getFirstStage(callId: string) {
        const firstStage = await this.repository.getFirstStage(callId);
        if (!firstStage) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
        return firstStage;
    }*/

    /*
async findNextStage(id: string) {
    const stageDoc = await this.repository.findById(id);
    if (!stageDoc) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
    const nextStage = await this.repository.getNextStage(String(stageDoc.call), stageDoc.order);
    if (!nextStage) throw new AppError(ERROR_CODES.NEXT_STAGE_NOT_FOUND);
    return nextStage;
} */

    async getPreviousStage(id: string) {
        const stageDoc = await this.repository.findById(id);

        if (!stageDoc) {
            throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
        }

        const previousStage = await this.repository.findPreviousStage(
            String(stageDoc.call),
            stageDoc.order
        );

        if (!previousStage) {
            throw new AppError(ERROR_CODES.PREVIOUS_STAGE_NOT_FOUND);
        }

        return previousStage;
    }


    async exists(filter: FilterStageDto) {
        return await this.repository.exists(filter);
    }

    /**
 * Update a stage
 */
    async update(dto: UpdateStageDTO, userId: string) {
        const { id, data } = dto;

        const stageDoc = await this.repository.findById(id);
        if (!stageDoc) {
            throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
        }

        const minReviewers =
            data.minReviewers ?? stageDoc.minReviewers;

        const maxReviewers =
            data.maxReviewers ?? stageDoc.maxReviewers;

        const minAcceptanceScore =
            data.minAcceptanceScore ?? stageDoc.minAcceptanceScore;

        // 4. Reviewer validation
        if (minReviewers > maxReviewers) {
            throw new AppError(ERROR_CODES.INVALID_REVIEWER_RANGE);
        }

        // 5. Evaluation validation
        const evalDoc = await this.evalRepository.findById(
            stageDoc.evaluation.toString()
        );

        if (!evalDoc) {
            throw new AppError(ERROR_CODES.EVALUATION_NOT_FOUND);
        }

        // 6. Minimum score validation
        if (minAcceptanceScore > evalDoc.weight) {
            throw new AppError(
                ERROR_CODES.MIN_SCORE_EXCEEDS_EVALUATION_WEIGHT
            );
        }

        // 7. Prevent negative values
        if (
            minReviewers < 0 ||
            maxReviewers < 0 ||
            minAcceptanceScore < 0
        ) {
            throw new AppError(ERROR_CODES.INVALID_STAGE_CONFIGURATION);
        }
        const updated = await this.repository.update(id, data, userId);
        if (stageDoc.order === 1) {
            await this.syncCallDeadline(String(stageDoc.call), userId);
        }
        return updated;
    }

    async transitionState(
        dto: TransitionRequestDto,
        userId: string
    ) {
        const { id, current, next } = dto;

        const stage = await this.repository.findById(id);

        if (!stage) {
            throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
        }

        const from = stage.status as StageStatus;
        const to = next as StageStatus;

        // --------------------------------------------------
        // Check client state consistency
        // --------------------------------------------------

        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        // --------------------------------------------------
        // Validate transition
        // --------------------------------------------------

        TransitionHelper.validateTransition(
            from,
            to,
            STAGE_TRANSITIONS
        );

        // --------------------------------------------------
        // Active → Upcoming
        // Only allowed when no applications exist
        // --------------------------------------------------

        if (
            from === StageStatus.active &&
            to === StageStatus.upcoming
        ) {
            const hasApplications =
                await this.applicationRepo.exists({
                    stage: id
                });

            if (hasApplications) {
                throw new AppError(
                    ERROR_CODES.STAGE_HAS_APPLICATIONS
                );
            }
        }

        // --------------------------------------------------
        // Update status
        // --------------------------------------------------

        return await this.repository.updateStatus(
            id,
            to,
            userId
        );
    }

    /**
     * Delete a stage
    */
    async delete(id: string, userId: string) {
        const stageDoc = await this.repository.findById(id);

        if (!stageDoc) {
            throw new Error(ERROR_CODES.STAGE_NOT_FOUND);
        }

        const { call, order } = stageDoc;

        const hasApplication = await this.applicationRepo.exists({
            stage: id
        });

        if (hasApplication) {
            throw new AppError(
                ERROR_CODES.APPLICATION_ALREADY_EXISTS,
                "Cannot delete stage because an application already exists for it"
            );
        }

        const deleted = await this.repository.delete(id);

        if (deleted) {
            await this.repository.updateMany(
                {
                    call,
                    order: { $gt: order }
                },
                {
                    $inc: { order: -1 }
                }
            );
        }

        if (order === 1) {
            await this.syncCallDeadline(String(stageDoc.call), userId);
        }

        return deleted;
    }
}

export const STAGE_TRANSITIONS: Record<
    StageStatus,
    StageStatus[]
> = {
    [StageStatus.upcoming]: [
        StageStatus.active
    ],

    [StageStatus.active]: [
        StageStatus.closed,
        StageStatus.upcoming
    ],

    [StageStatus.closed]: [
        StageStatus.active
    ]
};

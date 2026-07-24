import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { IEvaluationRepository } from "../../evaluations/evaluation.repository";
import { EvalStatus } from "../../evaluations/evaluation.state-machine";
import { ICallRepository } from "../call.repository";
import { CreateStageDTO, GetStageDTO, UpdateStageDTO } from "./stage.dto";
//import { StageCategory } from "./grant.stage.model";
import { CallStatus } from "../call.model";
import { IStageRepository } from "./stage.repository";

export class StageService {

    constructor(
        private readonly repository: IStageRepository,
        private readonly callRepository: ICallRepository,
        private readonly evalRepository: IEvaluationRepository
    ) {
    }


    async validateCall(callId: string) {
        const callDoc = await this.callRepository.findById(callId);
        if (!callDoc) throw new Error(ERROR_CODES.CALL_NOT_FOUND);
        if (callDoc.status !== CallStatus.planned)
            throw new AppError(ERROR_CODES.CALL_NOT_PLANNED);
        return callDoc;
    }

    async syncCallDeadline(callId: string) {
        const firstStage = await this.repository.findOne(callId, 1);
        return await this.callRepository.update(callId, {
            deadline: firstStage ? firstStage.deadline : null,
        });
    }

    /**
     * Create a new stage
     */
    async create(dto: CreateStageDTO) {
        const {
            call,
            evaluation,
            minReviewers,
            maxReviewers,
            minAcceptanceScore
        } = dto;

        // 1. Reviewer validation
        if (minReviewers > maxReviewers) {
            throw new AppError(ERROR_CODES.INVALID_REVIEWER_RANGE);
        }
        // 2. Call validation
        const callDoc = await this.validateCall(call);

        // 3. Evaluation validation
        const evalDoc = await this.evalRepository.findById(evaluation);
        if (!evalDoc) throw new Error(ERROR_CODES.EVALUATION_NOT_FOUND);
        if (evalDoc.status !== EvalStatus.published) throw new AppError(ERROR_CODES.EVALUATION_NOT_PUBLISHED);

        const totalWeight = evalDoc.weight;
        // 4. NEW: MinAcceptance logic validation

        if (minAcceptanceScore > totalWeight) {
            throw new AppError(ERROR_CODES.MIN_SCORE_EXCEEDS_EVALUATION_WEIGHT);
        }
        try {
            let nextOrder = 0;

            const stages = await this.repository.countStages(call);
            nextOrder = stages + 1;

            const stage = await this.repository.create({
                ...dto,
                order: nextOrder
            });

            if (nextOrder === 1) {
                await this.syncCallDeadline(call);
            }


            return stage;
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.STAGE_ALREADY_EXISTS);
            }
            throw err;
        }
    }
    /**
     * Get all stages or by call
     */
    async get(dto: GetStageDTO) {
        return await this.repository.find(dto);
    }


    /**
     * Get all stages or by call
     * async getUpcomingVerification() {
        return await this.repository.findUpcomingVerifications();
    }
     */


    async getById(id: string) {
        const stage = await this.repository.findById(id);
        if (!stage) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
        return stage;
    }


    /**
 * Update a stage
 */
    async update(dto: UpdateStageDTO) {
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
        const updated = await this.repository.update(id, data);
        if (stageDoc.order === 1) {
            await this.syncCallDeadline(String(stageDoc.call));
        }
        return updated;
    }

    /**
     * Delete a stage
    */
    async delete(id: string) {
        const stageDoc = await this.repository.findById(id);
        if (!stageDoc) throw new Error(ERROR_CODES.STAGE_NOT_FOUND);
        const { call, order } = stageDoc;
        await this.validateCall(String(call));

        const deleted = await this.repository.delete(id);
        // Re-arrange orders of remaining selection stages
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
            await this.syncCallDeadline(String(stageDoc.call));
        }
        return deleted
    }
}

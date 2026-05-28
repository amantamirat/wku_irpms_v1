import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { IEvaluationRepository } from "../../evaluations/evaluation.repository";
import { EvalStatus } from "../../evaluations/evaluation.state-machine";
import { GrantStatus } from "../grant.model";
import { IGrantRepository } from "../grant.repository";
import { CreateStageDTO, GetStageDTO, UpdateStageDTO } from "./grant.stage.dto";
import { StageCategory } from "./grant.stage.model";
//import { DecisionMode } from "./grant.stage.model";
import { IGrantStageRepository } from "./grant.stage.repository";

export class GrantStageService {

    constructor(
        private readonly repository: IGrantStageRepository,
        private readonly grantRepository: IGrantRepository,
        private readonly evalRepository: IEvaluationRepository
    ) {

    }

    async validateGrant(grantId: string) {
        const grantDoc = await this.grantRepository.findById(grantId);
        if (!grantDoc) throw new Error(ERROR_CODES.GRANT_NOT_FOUND);
        if (grantDoc.status !== GrantStatus.planned)
            throw new AppError(ERROR_CODES.GRANT_NOT_PLANNED);
        return grantDoc;
    }
    /**
     * Create a new stage
     */
    async create(dto: CreateStageDTO) {
        const {
            grant,
            evaluation,
            minReviewers,
            maxReviewers,
            category,
            minAcceptanceScore
        } = dto;

        // 1. Reviewer validation
        if (minReviewers > maxReviewers) {
            throw new AppError(ERROR_CODES.INVALID_REVIEWER_RANGE);
        }

        // 2. Grant validation
        const grantDoc = await this.validateGrant(grant);

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
            if (category === StageCategory.selection) {
                const stages = await this.repository.countStages(grant, category);
                nextOrder = stages + 1;
            }
            const stage = await this.repository.create({
                ...dto,
                order: nextOrder
            });

            return stage;
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.STAGE_ALREADY_CLOSED);
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

        // 1. Existing stage validation
        const stageDoc = await this.repository.findById(id);
        if (!stageDoc) {
            throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
        }

        // 2. Merge existing + incoming values
        const minReviewers =
            data.minReviewers ?? stageDoc.minReviewers;

        const maxReviewers =
            data.maxReviewers ?? stageDoc.maxReviewers;

        const minAcceptanceScore =
            data.minAcceptanceScore ?? stageDoc.minAcceptanceScore;

        // 3. Reviewer validation
        if (minReviewers > maxReviewers) {
            throw new AppError(ERROR_CODES.INVALID_REVIEWER_RANGE);
        }

        // 4. Evaluation validation
        const evalDoc = await this.evalRepository.findById(
            stageDoc.evaluation.toString()
        );

        if (!evalDoc) {
            throw new AppError(ERROR_CODES.EVALUATION_NOT_FOUND);
        }

        // 5. Minimum score validation
        if (minAcceptanceScore > evalDoc.weight) {
            throw new AppError(
                ERROR_CODES.MIN_SCORE_EXCEEDS_EVALUATION_WEIGHT
            );
        }

        // Optional:
        // prevent negative values
        if (
            minReviewers < 0 ||
            maxReviewers < 0 ||
            minAcceptanceScore < 0
        ) {
            throw new AppError(ERROR_CODES.INVALID_STAGE_CONFIGURATION);
        }

        // 6. Update
        return await this.repository.update(id, data);
    }

    /**
     * Delete a stage
    */
    async delete(id: string) {
        const stageDoc = await this.repository.findById(id);
        if (!stageDoc) throw new Error(ERROR_CODES.STAGE_NOT_FOUND);
        const { grant, order } = stageDoc;
        await this.validateGrant(String(grant));
        //check the project        
        const deleted = await this.repository.delete(id);
        // Re-arrange orders of remaining selection stages
        if (deleted) {
            await this.repository.updateMany(
                {
                    grant,
                    order: { $gt: order }
                },
                {
                    $inc: { order: -1 }
                }
            );
        }
        return deleted
    }
}

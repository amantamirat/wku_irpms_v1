import { DeleteDto } from "../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { GrantStageRepository } from "../grants/stages/grant.stage.repository";
import { CriterionRepository, ICriterionRepository } from "./criteria/criterion.repository";
import { CreateEvaluationDTO, GetEvaluationsDTO, UpdateEvaluationDTO } from "./evaluation.dto";
import { IEvaluationRepository } from "./evaluation.repository";
import { EVAL_TRANSITIONS, EvalStatus } from "./evaluation.state-machine";

export class EvaluationService {

    constructor(private readonly repository: IEvaluationRepository,
        private readonly criterionRepo: ICriterionRepository = new CriterionRepository(),
        private readonly grantStageRepo = new GrantStageRepository(),
    ) {
    }

    async create(dto: CreateEvaluationDTO) {
        try {
            return await this.repository.create(dto);
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.EVALUATION_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    async get(options: GetEvaluationsDTO) {
        return await this.repository.find(options);
    }

    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next } = dto;

        const evalDoc = await this.repository.findById(id);
        if (!evalDoc) {
            throw new AppError(ERROR_CODES.EVALUATION_NOT_FOUND);
        }
        const from = evalDoc.status as EvalStatus;
        const to = next as EvalStatus;
        // optional UI consistency check
        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        TransitionHelper.validateTransition(
            from,
            to,
            EVAL_TRANSITIONS
        );

        // Inside transitionState logic
        if (to === EvalStatus.published) {
            const criteria = await this.criterionRepo.find({ evaluation: id });
            const totalCriteriaWeight = criteria.reduce((sum, item) => sum + (item.weight || 0), 0);

            if (Math.abs(totalCriteriaWeight - evalDoc.weight) > 0.001) {
                throw new AppError(
                    ERROR_CODES.EVALUATION_WEIGHT_MISMATCH,
                    `Cannot publish: Criteria sum (${totalCriteriaWeight}) must match Evaluation weight (${evalDoc.weight})`
                );
            }
        }

        if (next === EvalStatus.draft) {
            if (await this.grantStageRepo.exists({ evaluation: id })) {
                throw new AppError(ERROR_CODES.STAGE_ALREADY_EXISTS);
            }
        }

        return await this.repository.update(id, {
            status: to
        });
    }

    async update(dto: UpdateEvaluationDTO) {
        const { id, data } = dto;

        // 1. Fetch current document to check status
        const existingEval = await this.repository.findById(id);
        if (!existingEval) {
            throw new AppError(ERROR_CODES.EVALUATION_NOT_FOUND);
        }

        // 2. Restriction: Only allow weight updates if status is 'planned'
        if (existingEval.status !== EvalStatus.draft) {
            // If the weight is present in the DTO, remove it or throw error
            if (data.weight !== undefined && data.weight !== existingEval.weight) {
                // Option A: Silently ignore/remove it (common for UI/UX smoothness)
                delete data.weight;
                // Option B: Hard fail (recommended for API integrity)
                // throw new AppError(ERROR_CODES.EVALUATION_WEIGHT_LOCKED);
            }
        }

        // 3. Update the document with the (potentially sanitized) data
        const evalDoc = await this.repository.update(id, data);
        if (!evalDoc) throw new Error(ERROR_CODES.EVALUATION_NOT_FOUND);

        return evalDoc;
    }

    async delete(dto: DeleteDto) {
        const { id } = dto;

        // 1. Verify the evaluation exists
        const evalDoc = await this.repository.findById(id);
        if (!evalDoc) {
            throw new AppError(ERROR_CODES.EVALUATION_NOT_FOUND);
        }

        // 2. Safety Check: Only allow deletion if still in 'planned' status
        // This prevents deleting evaluations that are already active or closed (which have historical data)
        if (evalDoc.status !== EvalStatus.draft) {
            throw new AppError(ERROR_CODES.EVALUATION_NOT_DRAFT);
        }

        // 3. Cascade Delete: Remove all criteria associated with this evaluation
        // We no longer throw an error if criteria exist; we just wipe them out.
        await this.criterionRepo.deleteByEvaluation(id);

        // 4. Finally, delete the evaluation itself
        return await this.repository.delete(id);
    }
}

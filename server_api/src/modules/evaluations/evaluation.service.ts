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


    async update(dto: UpdateEvaluationDTO) {
        const { id, data, userId } = dto;
        const evalDoc = await this.repository.update(id, data);
        if (!evalDoc) throw new Error(ERROR_CODES.EVALUATION_NOT_FOUND);
        return evalDoc;
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

        if (next === EvalStatus.planned) {
            if (await this.grantStageRepo.exists({ evaluation: id })) {
                throw new AppError(ERROR_CODES.STAGE_ALREADY_EXISTS);
            }
        }

        return await this.repository.update(id, {
            status: to
        });
    }

    async delete(dto: DeleteDto) {
        const { id } = dto;
        const evalDoc = await this.repository.findById(id);
        if (!evalDoc) throw new AppError(ERROR_CODES.EVALUATION_NOT_FOUND);
        if (evalDoc.status !== EvalStatus.planned) throw new AppError(ERROR_CODES.EVALUATION_NOT_PLANNED);
        //delete many
        const countCriteria = await this.criterionRepo.countDocuments(id);
        if (countCriteria > 0) {
            throw new Error(ERROR_CODES.CRITERION_ALREADY_EXISTS);
        }
        return await this.repository.delete(id);
    }
}

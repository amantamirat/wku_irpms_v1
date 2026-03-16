import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { DeleteDto } from "../../common/dtos/delete.dto";
import { IOrganizationRepository, OrganizationRepository } from "../organization/organization.repository";
import { CriterionRepository, ICriterionRepository } from "./criteria/criterion.repository";
import { CreateEvaluationDTO, GetEvaluationsDTO, UpdateEvaluationDTO } from "./evaluation.dto";
import { IEvaluationRepository } from "./evaluation.repository";
import { Unit } from "../../common/constants/enums";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { EVAL_TRANSITIONS, EvalStatus } from "./evaluation.state-machine";
import { TransitionHelper } from "../../common/helpers/transition.helper";

export class EvaluationService {

    constructor(private readonly repository: IEvaluationRepository,
        private readonly organizationRepository: IOrganizationRepository = new OrganizationRepository(),
        private readonly criterionRepository: ICriterionRepository = new CriterionRepository(),
    ) {
    }

    async create(dto: CreateEvaluationDTO) {
        const organizationDoc = await this.organizationRepository.findById(dto.organization);
        if (!organizationDoc) throw new Error(ERROR_CODES.ORGANIZATION_NOT_FOUND);

        const orgUnit = organizationDoc.type;

        // Must be either directorate or external
        if (orgUnit !== Unit.directorate && orgUnit !== Unit.external) {
            throw new Error(ERROR_CODES.ORGANIZATION_NOT_FOUND);
        }

        const created = await this.repository.create(dto);
        return created;
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
            //if (await this.callRepository.exists({ calendar: id })) {
               // throw new AppError(ERROR_CODES.CALL_ALREADY_EXISTS);
           // }
        }

        return await this.repository.update(id, {
            status: to
        });
    }

    async delete(dto: DeleteDto) {
        const { id } = dto;
        const evalDoc = await this.repository.findById(id);
        if (!evalDoc) throw new AppError(ERROR_CODES.EVALUATION_NOT_FOUND);
        const countCriteria = await this.criterionRepository.countDocuments(id);
        if (countCriteria > 0) {
            throw new Error(ERROR_CODES.CRITERION_ALREADY_EXISTS);
        }
        return await this.repository.delete(id);
    }
}

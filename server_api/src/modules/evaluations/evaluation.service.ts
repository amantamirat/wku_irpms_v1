import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { DeleteDto } from "../../util/delete.dto";
import { IOrganizationRepository, OrganizationRepository } from "../organization/organization.repository";
import { CriterionRepository, ICriterionRepository } from "./criteria/criterion.repository";
import { CreateEvaluationDTO, GetEvaluationsDTO, UpdateEvaluationDTO } from "./evaluation.dto";
import { IEvaluationRepository } from "./evaluation.repository";

export class EvaluationService {

    constructor(private readonly repository: IEvaluationRepository,
        private readonly organizationRepository: IOrganizationRepository = new OrganizationRepository(),
        private readonly criterionRepository: ICriterionRepository = new CriterionRepository(),
    ) {
    }

    async create(dto: CreateEvaluationDTO) {
        const directorateDoc = await this.organizationRepository.findById(dto.directorate);
        if (!directorateDoc) {
            throw new Error(ERROR_CODES.DIRECTORATE_NOT_FOUND);
        }
        const createdEvaluation = await this.repository.create(dto);
        return createdEvaluation;
    }

    async getEvaluations(options: GetEvaluationsDTO) {
        return await this.repository.find(options);
    }


    async update(dto: UpdateEvaluationDTO) {
        const { id, data, userId } = dto;
        const evalDoc = await this.repository.update(id, data);
        if (!evalDoc) throw new Error(ERROR_CODES.EVALUATION_NOT_FOUND);
        return evalDoc;
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

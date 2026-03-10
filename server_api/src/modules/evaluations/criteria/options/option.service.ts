import { AppError } from "../../../../common/errors/app.error";
import { ERROR_CODES } from "../../../../common/errors/error.codes";
import { DeleteDto } from "../../../../common/dtos/delete.dto";
import { IResultRepository, ResultRepository } from "../../../calls/stages/reviewers/results/result.repository";
import { FormType } from "../criterion.enum";
import { CriterionRepository, ICriterionRepository } from "../criterion.repository";
import {
    CreateOptionDTO,
    GetOptionsDTO,
    UpdateOptionDTO,
} from "./option.dto";
import { IOptionRepository, OptionRepository } from "./option.repository";

export class OptionService {

    constructor(
        private readonly repository: IOptionRepository = new OptionRepository(),
        private readonly criterionRepo: ICriterionRepository = new CriterionRepository(),
        private readonly resultRepository: IResultRepository = new ResultRepository(),
    ) { }

    /**
     * Create a new option under a criterion.
     */
    async create(dto: CreateOptionDTO) {
        const { criterion, title, score } = dto;

        const criterionDoc = await this.criterionRepo.findById(criterion);
        if (!criterionDoc) throw new AppError(ERROR_CODES.CRITERION_NOT_FOUND);
        if (criterionDoc.formType !== FormType.closed)
            throw new AppError(ERROR_CODES.CRITERION_NOT_CLOSED);

        if (score > criterionDoc.weight)
            throw new AppError(ERROR_CODES.INVALID_OPTION_WEIGHT);

        return await this.repository.create(dto);
    }

    /**
     * Get all options under a given criterion.
     */
    async getOptions(dto: GetOptionsDTO) {
        return await this.repository.find(dto);
    }

    /**
     * Update an existing option.
     */
    async update(dto: UpdateOptionDTO) {
        const { id, data } = dto;

        const option = await this.repository.findById(id);
        if (!option) throw new AppError(ERROR_CODES.OPTION_NOT_FOUND);

        if (data.score) {
            const criterion = await this.criterionRepo.findById(String(option.criterion));
            if (!criterion) throw new AppError(ERROR_CODES.CRITERION_NOT_CLOSED);
            if (data.score > criterion.weight)
                throw new AppError(ERROR_CODES.INVALID_OPTION_WEIGHT);
        }
        return this.repository.update(id, data);
    }

    /**
     * Delete an option by ID.
     */
    async delete(dto: DeleteDto) {
        const { id } = dto;
        const resExists = await this.resultRepository.exists({ selectedOption: id });
        if (resExists)
            throw new AppError(ERROR_CODES.RESULT_ALREADY_EXISTS);
        return await this.repository.delete(id);
    }
}

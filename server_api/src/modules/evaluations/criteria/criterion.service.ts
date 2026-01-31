import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { IResultRepository, ResultRepository } from "../../calls/stages/reviewers/results/result.repository";
import { Evaluation } from "../evaluation.model";
import { EvaluationRepository, IEvaluationRepository } from "../evaluation.repository";
import {
    CreateCriterionDTO,
    GetCriteriaDTO,
    ImportCriteriaBatchDTO,
    UpdateCriterionDTO,
} from "./criterion.dto";
import { FormType } from "./criterion.enum";
import { Criterion } from "./criterion.model";
import { CriterionRepository, ICriterionRepository } from "./criterion.repository";
import { Option } from "./options/option.model";
import { IOptionRepository, OptionRepository } from "./options/option.repository";

export class CriterionService {

    constructor(
        private readonly repository: ICriterionRepository = new CriterionRepository(),
        private readonly optionRepository: IOptionRepository = new OptionRepository(),
        private readonly resultRepository: IResultRepository = new ResultRepository(),
        private readonly evalRepository: IEvaluationRepository = new EvaluationRepository()
    ) { }

    /**
     * Create a single criterion.
     */
    async create(dto: CreateCriterionDTO) {
        const evalDoc = await this.evalRepository.findById(dto.evaluation);
        if (!evalDoc) throw new AppError(ERROR_CODES.EVALUATION_NOT_FOUND);
        return await this.repository.create(dto);
    }

    async get(dto: GetCriteriaDTO) {
        return await this.repository.find(dto);
    }

    /**
     * Update an existing criterion.
     */
    async update(dto: UpdateCriterionDTO) {
        const { id, data } = dto;
        const { title, formType, weight } = data

        const criterion = await this.repository.findById(id);
        if (!criterion) throw new Error(ERROR_CODES.CRITERION_NOT_FOUND);

        if (criterion.formType === FormType.closed) {
            const options = await this.optionRepository.find({ criterion: id });

            if (formType) {
                if (formType === FormType.open) {
                    if (options.length > 0) {
                        throw new AppError(
                            ERROR_CODES.OPTION_ALREADY_EXISTS
                        );
                    }
                }
            }

            if (weight) {
                for (const opt of options) {
                    if (opt.score !== undefined && opt.score > weight) {
                        throw new AppError(
                            ERROR_CODES.INVALID_CRITERION_WEIGHT
                        );
                    }
                }
            }
        }

        return this.repository.update(id, data);
    }

    /**
    * Delete a criterion only if no options exist.
    */
    async delete(id: string) {
        const options = await this.optionRepository.find({ criterion: id });
        if (options.length > 0) {
            throw new AppError(
                ERROR_CODES.OPTION_ALREADY_EXISTS
            );
        }
        const resExists = await this.resultRepository.exists({ criterion: id });
        if (resExists) {
            throw new AppError(
                ERROR_CODES.RESULT_ALREADY_EXISTS
            );
        }
        return await this.repository.delete(id);
    }






    /**
     * Batch import criteria (with optional options) under a given evaluation.
     */
    static async importCriteriaBatch(dto: ImportCriteriaBatchDTO) {
        const { evaluation, criteriaData } = dto;

        // 1️⃣ Validate evaluation exists
        const _evaluation = await Evaluation.findById(evaluation);
        if (!_evaluation) throw new Error("Evaluation not found.");

        const createdResults = [];

        // 2️⃣ Create criteria and options in sequence
        for (const criterion of criteriaData) {
            // Create criterion
            const criterionDoc = await Criterion.create({
                evaluation: evaluation,
                title: criterion.title,
                weight: criterion.weight,
                formType: criterion.formType,
            });

            let createdOptions = [];

            // If closed form, process options
            if (criterion.formType === FormType.closed && Array.isArray(criterion.options)) {
                for (const opt of criterion.options) {
                    if (opt.score > criterion.weight) continue; // skip invalid option

                    const optionDoc = await Option.create({
                        criterion: criterionDoc._id,
                        title: opt.title,
                        score: opt.score,
                    });

                    createdOptions.push(optionDoc);
                }
            }

            createdResults.push({ criterion: criterionDoc, options: createdOptions });
        }

        return createdResults;
    }
}

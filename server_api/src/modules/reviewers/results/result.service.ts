//result.service.ts
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { FormType } from "../../evaluations/criteria/criterion.model";
import { ICriterionRepository } from "../../evaluations/criteria/criterion.repository";
import { IReviewerRepository } from "../reviewer.repository";
import { ReviewerStatus } from "../reviewer.state-machine";
import { CreateResultDTO, GetResultsDTO, UpdateResultDTO } from "./result.dto";
import { IResultRepository } from "./result.repository";


export class ResultService {

    constructor(
        private readonly repository: IResultRepository,
        private readonly reviewerRepo: IReviewerRepository,
        private readonly criterionRepository: ICriterionRepository,
        //private readonly optionRepository: IOptionRepository = new OptionRepository(),
    ) { }


    async create(dto: CreateResultDTO) {
        throw new AppError(ERROR_CODES.UNSUPPORTED_OPERTATION);
        /**
         * const { reviewer, applicantId } = dto;

        const reviewerDoc = await this.reviewerRepo.findById(reviewer);
        if (!reviewerDoc) throw new AppError(ERROR_CODES.REVIEWER_NOT_FOUND);

        if (reviewerDoc.status !== ReviewerStatus.accepted)
            throw new AppError(ERROR_CODES.REVIEWER_NOT_ACCEPTED);

        if (String(reviewerDoc.applicant) !== applicantId && SYSTEM.SU_USER !== applicantId)
            throw new AppError(ERROR_CODES.USER_NOT_REVIEWER);

        await this.validateResult(dto.criterion, dto);

        return this.repository.create(dto);
         */

    }

    async getResults(options: GetResultsDTO) {
        return this.repository.find({ ...options, populate: true });
    }

    private async validateResult(
        criterion: string,
        dto: Partial<UpdateResultDTO["data"]>
    ) {
        const { score, selectedOptions } = dto;

        const criterionDoc = await this.criterionRepository.findById(criterion);
        if (!criterionDoc) throw new Error(ERROR_CODES.CRITERION_NOT_FOUND);

        // ✅ OPEN → manual + comment
        if (criterionDoc.formType === FormType.OPEN) {
            // ✅ comment is required (if isRequired)
            if (criterionDoc.isRequired && !dto.comment) {
                throw new AppError(ERROR_CODES.COMMENT_REQUIRED);
            }

        }

        // ✅ NUMBER → direct numeric input (same as OPEN but no comment requirement)
        else if (criterionDoc.formType === FormType.NUMBER) {
            if (score === undefined || score === null) {
                throw new AppError(ERROR_CODES.SCORE_REQUIRED);
            }

            const maxScore = criterionDoc.weight;
            if (score < 0 || score > maxScore) {
                throw new AppError(ERROR_CODES.SCORE_OUT_OF_RANGE, `Score must be between 0 and ${maxScore}`);
            }
        }

        // ✅ SINGLE CHOICE
        else if (criterionDoc.formType === FormType.SINGLE_CHOICE) {
            if (!selectedOptions || selectedOptions.length !== 1) {
                throw new AppError(ERROR_CODES.TOO_MANY_OPTIONS, "Exactly one option must be selected");
            }

            const optionId = selectedOptions[0];

            const option = criterionDoc.options.find(
                (opt) => String(opt._id) === String(optionId)
            );
            if (!option) throw new Error(ERROR_CODES.OPTION_NOT_FOUND);
            // ✅ auto-assign score
            dto.score = option.score;
        }

        // ✅ MULTIPLE CHOICE
        else if (criterionDoc.formType === FormType.MULTIPLE_CHOICE) {
            if (!selectedOptions || selectedOptions.length === 0) {
                throw new AppError(ERROR_CODES.OPTION_REQUIRED, "At least one option must be selected");
            }
            let totalScore = 0;

            for (const optionId of selectedOptions) {
                const option = criterionDoc.options.find(
                    (opt) => String(opt._id) === String(optionId)
                );
                if (!option) throw new Error(ERROR_CODES.OPTION_NOT_FOUND);
                totalScore += option.score;
            }
            // ✅ Optional: cap by weight
            dto.score = Math.min(totalScore, criterionDoc.weight);
        }

        return { dto };
    }

    async update(dto: UpdateResultDTO) {
        const { id, applicantId } = dto;
        const resultDoc = await this.repository.findById(id);
        if (!resultDoc) throw new AppError(ERROR_CODES.RESULT_NOT_FOUND);

        const reviewerDoc = await this.reviewerRepo.findById(String(resultDoc.reviewer));
        if (!reviewerDoc) throw new AppError(ERROR_CODES.REVIEWER_NOT_FOUND);

        if (String(reviewerDoc.applicant) !== applicantId)
            throw new AppError(ERROR_CODES.UNAUTHORIZED);

        if (reviewerDoc.status !== ReviewerStatus.accepted)
            throw new AppError(ERROR_CODES.REVIEWER_NOT_ACCEPTED);

        await this.validateResult(String(resultDoc.criterion), dto.data);
        return this.repository.update(dto.id, dto.data);
    }

    async delete(dto: DeleteDto) {
        throw new AppError(ERROR_CODES.UNSUPPORTED_OPERTATION);
        /*
        const { id, applicantId } = dto;
        const resultDoc = await this.repository.findById(id);
        if (!resultDoc) throw new Error(ERROR_CODES.RESULT_NOT_FOUND);

        const reviewerDoc = await this.reviewerRepo.findById(String(resultDoc.reviewer));
        if (!reviewerDoc) throw new AppError(ERROR_CODES.REVIEWER_NOT_FOUND);

        if (reviewerDoc.status !== ReviewerStatus.accepted)
            throw new AppError(ERROR_CODES.REVIEWER_NOT_ACCEPTED);

        if (String(reviewerDoc.applicant) !== applicantId && SYSTEM.SU_USER !== applicantId)
            throw new AppError(ERROR_CODES.USER_NOT_REVIEWER);

        return this.repository.delete(id);
        */
    }
}

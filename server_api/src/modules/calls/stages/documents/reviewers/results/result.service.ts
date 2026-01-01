//result.service.ts
import { FormType } from "../../../../../evaluations/criteria/criterion.enum";
import { IReviewerRepository, ReviewerRepository } from "../reviewer.repository";
import { CreateResultDTO, GetResultsDTO, UpdateResultDTO } from "./result.dto";
import { IResultRepository, ResultRepository } from "./result.repository";
//import { ReviewerPermission } from "../reviewer.permission";
import { DeleteDto } from "../../../../../../util/delete.dto";
import { CriterionRepository, ICriterionRepository } from "../../../../../evaluations/criteria/criterion.repository";
import { IOptionRepository, OptionRepository } from "../../../../../evaluations/criteria/options/option.repository";
import { ReviewerStatus } from "../reviewer.status";
import { ERROR_CODES } from "../../../../../../common/errors/error.codes";
import { AppError } from "../../../../../../common/errors/app.error";
import { SYSTEM } from "../../../../../../common/constants/system.constant";


export class ResultService {
    private repository: IResultRepository;
    private reviewerRepo: IReviewerRepository;
    private criterionRepository: ICriterionRepository;
    private optionRepository: IOptionRepository;
    //private reviewerPerm: ReviewerPermission;

    constructor(repository?: IResultRepository, reviewerRepo?: IReviewerRepository,
        criterionRepository?: ICriterionRepository
    ) {
        this.repository = repository || new ResultRepository();
        this.reviewerRepo = reviewerRepo || new ReviewerRepository();
        this.criterionRepository = criterionRepository || new CriterionRepository();
        this.optionRepository = new OptionRepository();
    }

    private async validateResult(criterion: string, dto: Partial<UpdateResultDTO["data"]>) {
        const { score, selectedOption } = dto;
        const criterionDoc = await this.criterionRepository.findById(criterion);
        if (!criterionDoc) throw new Error("Criterion not found");

        if (criterionDoc.formType === FormType.open) {
            // For open form type, score should be directly provided
            if (score === undefined || score === null) {
                throw new Error("Score not found");
            }
            const maxScore = criterionDoc.weight;
            if (score < 0 || score > maxScore) {
                throw new Error(`Score must be between 0 and ${maxScore}`);
            }

        }
        else if (criterionDoc.formType === FormType.closed) {
            // For closed form type, get score from selected option
            if (!selectedOption) {
                throw new Error("Selected option ID is required for closed form type");
            }
            const selectedOptionDoc = await this.optionRepository.findById(selectedOption);
            if (!selectedOptionDoc || String(selectedOptionDoc.criterion) !== String(criterionDoc._id)) {
                throw new Error("Option not found");
            }
            dto.score = selectedOptionDoc.score;
        }

        return { dto };
    }

    async create(dto: CreateResultDTO) {
        const { reviewer, applicantId } = dto;
        
        const reviewerDoc = await this.reviewerRepo.findById(reviewer);
        if (!reviewerDoc) throw new AppError(ERROR_CODES.REVIEWER_NOT_FOUND);

        if (reviewerDoc.status !== ReviewerStatus.verified)
            throw new AppError(ERROR_CODES.REVIEWER_NOT_VERIFIED);
        
        if (String(reviewerDoc.applicant) !== applicantId && SYSTEM.SU_USER !== applicantId)
            throw new AppError(ERROR_CODES.USER_NOT_REVIEWER);

        await this.validateResult(dto.criterion, dto);
        return this.repository.create(dto);
    }

    async getResults(options: GetResultsDTO) {
        return this.repository.findByReviewer(options.reviewerId);
    }

    async update(dto: UpdateResultDTO) {
        const { id, applicantId } = dto;
        const resultDoc = await this.repository.findById(id);
        if (!resultDoc) throw new Error("Result not found");

        const reviewerDoc = await this.reviewerRepo.findById(String(resultDoc.reviewer));
        if (!reviewerDoc) throw new AppError(ERROR_CODES.REVIEWER_NOT_FOUND);

        if (reviewerDoc.status !== ReviewerStatus.verified)
            throw new AppError(ERROR_CODES.REVIEWER_NOT_VERIFIED);

        if (String(reviewerDoc.applicant) !== applicantId && SYSTEM.SU_USER !== applicantId)
            throw new AppError(ERROR_CODES.USER_NOT_REVIEWER);

        await this.validateResult(String(resultDoc.criterion), dto.data);
        return this.repository.update(dto.id, dto.data);
    }

    async delete(dto: DeleteDto) {
        const { id, applicantId } = dto;
        const resultDoc = await this.repository.findById(id);
        if (!resultDoc) throw new Error("Result not found");

        const reviewerDoc = await this.reviewerRepo.findById(String(resultDoc.reviewer));
        if (!reviewerDoc) throw new AppError(ERROR_CODES.REVIEWER_NOT_FOUND);

        if (reviewerDoc.status !== ReviewerStatus.verified)
            throw new AppError(ERROR_CODES.REVIEWER_NOT_VERIFIED);

        if (String(reviewerDoc.applicant) !== applicantId && SYSTEM.SU_USER !== applicantId)
            throw new AppError(ERROR_CODES.USER_NOT_REVIEWER);

        return this.repository.delete(id);
    }
}

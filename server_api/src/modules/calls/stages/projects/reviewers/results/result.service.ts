//result.service.ts
import { IResultRepository, ResultRepository } from "./result.repository";
import { CreateResultDTO, DeleteResultDTO, GetResultsDTO, UpdateResultDTO } from "./result.dto";
import { Option } from "../../../../../evaluations/criteria/options/option.model";
import { FormType } from "../../../../../evaluations/criteria/criterion.enum";
import { Criterion } from "../../../../../evaluations/criteria/criterion.model";
import { IReviewerRepository, ReviewerRepository } from "../reviewer.repository";
import { ReviewerPermission } from "../reviewer.permission";
import { ReviewerStatus } from "../reviewer.enum";


export class ResultService {
    private repository: IResultRepository;
    private reviewerRepo: IReviewerRepository;
    private reviewerPerm: ReviewerPermission;

    constructor(repository?: IResultRepository, reviewerRepo?: IReviewerRepository,
        reviewerPermission?: ReviewerPermission
    ) {
        this.repository = repository || new ResultRepository();
        this.reviewerRepo = reviewerRepo || new ReviewerRepository();
        this.reviewerPerm = reviewerPermission || new ReviewerPermission(this.reviewerRepo);
    }

    private async validateResult(criterionId: string, dto: Partial<UpdateResultDTO["data"]>) {
        const { score, selectedOptionId } = dto;
        const criterionDoc = await Criterion.findById(criterionId).lean();
        if (!criterionDoc) throw new Error("Criterion not found");

        if (criterionDoc.form_type === FormType.open) {
            // For open form type, score should be directly provided
            if (score === undefined || score === null) {
                throw new Error("Score is required");
            }
            const maxScore = criterionDoc.weight;
            if (score < 0 || score > maxScore) {
                throw new Error(`Score must be between 0 and ${maxScore}`);
            }

        }
        else if (criterionDoc.form_type === FormType.closed) {
            // For closed form type, get score from selected option
            if (!selectedOptionId) {
                throw new Error("Selected option ID is required for closed form type");
            }
            const selectedOption = await Option.findById(selectedOptionId).lean();
            if (!selectedOption || String(selectedOption.criterion) !== String(criterionDoc._id)) {
                throw new Error("Selected option not found or does not belong to this criterion");
            }
            dto.score = selectedOption.score;
        }

        return { dto };
    }

    async createResult(dto: CreateResultDTO) {
        const { reviewerId, userId } = dto;
        const { reviewerDoc } = await this.reviewerPerm.validateReviewerPermission(reviewerId, userId);
        if (reviewerDoc.status !== ReviewerStatus.active)
            throw new Error("Reviewer is not active");
        await this.validateResult(dto.criterionId, dto);
        return this.repository.create(dto);
    }

    async getResults(options: GetResultsDTO) {
        return this.repository.findByReviewer(options.reviewerId);
    }

    async updateResult(dto: UpdateResultDTO) {
        const resultDoc = await this.repository.findById(dto.id);
        if (!resultDoc) throw new Error("Result not found");
        const { reviewerDoc } = await this.reviewerPerm.validateReviewerPermission(String(resultDoc.reviewer), dto.userId);
        if (reviewerDoc.status !== ReviewerStatus.active)
            throw new Error("Reviewer is not active");
        await this.validateResult(String(resultDoc.criterion), dto.data);
        return this.repository.update(dto.id, dto.data);
    }

    async deleteResult(dto: DeleteResultDTO) {
        if (!dto.userId) throw new Error("User ID is required for deletion");
        const resultDoc = await this.repository.findById(dto.id);
        if (!resultDoc) throw new Error("Result not found");
        const { reviewerDoc } = await this.reviewerPerm.validateReviewerPermission(String(resultDoc.reviewer), dto.userId);
        if (reviewerDoc.status !== ReviewerStatus.active)
            throw new Error("Reviewer is not active");
        return this.repository.delete(dto.id);
    }
}

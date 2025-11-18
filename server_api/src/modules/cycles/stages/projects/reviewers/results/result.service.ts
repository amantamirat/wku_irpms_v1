//result.service.ts
import { IResultRepository, ResultRepository } from "./result.repository";
import { CreateResultDTO, DeleteResultDTO, GetResultsDTO, UpdateResultDTO } from "./result.dto";
import { ReviewerStatus } from "../reviewer.enum";
import { Option } from "../../../../../evaluations/criteria/options/option.model";
import Applicant from "../../../../../applicants/applicant.model";
import { FormType } from "../../../../../evaluations/criteria/criterion.enum";
import { Criterion } from "../../../../../evaluations/criteria/criterion.model";
import { IReviewerRepository, ReviewerRepository } from "../reviewer.repository";

export class ResultService {
    private repository: IResultRepository;
    private reviewerRepo: IReviewerRepository;

    constructor(repository?: IResultRepository, reviewerRepo?: IReviewerRepository) {
        this.repository = repository || new ResultRepository();
        this.reviewerRepo = reviewerRepo || new ReviewerRepository();;
    }

    private async validateReviewerPermission(reviewerId: string, userId: string) {
        const reviewerDoc = await this.reviewerRepo.findById(reviewerId);
        if (!reviewerDoc) throw new Error("Reviewer not found");
        if (reviewerDoc.status !== ReviewerStatus.active) throw new Error("Reviewer is not active");

        const applicantDoc = await Applicant.findOne({ user: userId }).lean();
        if (!applicantDoc) throw new Error("Applicant not found");
        if (String(reviewerDoc.applicant) !== String(applicantDoc._id)) {
            throw new Error("You are not allowed to provide result for this project.");
        }

        return { reviewerDoc, applicantDoc };
    }

    private async validateResult(criterionId: string, score?: number, selectedOptionId?: string) {
        const criterionDoc = await Criterion.findById(criterionId).lean();
        if (!criterionDoc) throw new Error("Criterion not found");

        if (criterionDoc.form_type === FormType.open) {
            if (score === undefined || score === null) throw new Error("Score is required");
            const maxScore = criterionDoc.weight;
            if (score < 0 || score > maxScore) throw new Error(`Score must be between 0 and ${maxScore}`);
        }

        if (criterionDoc.form_type === FormType.closed) {
            const option = await Option.findById(selectedOptionId).lean();
            if (!option || String(option.criterion) !== String(criterionDoc._id)) {
                throw new Error("Selected option not found.");
            }
        }

        return { criterionDoc };
    }

    async createResult(dto: CreateResultDTO) {   
        await this.validateReviewerPermission(dto.reviewerId, dto.userId);
        await this.validateResult(dto.criterionId, dto.score, dto.selectedOptionId);
        return this.repository.create(dto);
    }

    async getResults(options: GetResultsDTO) {
        return this.repository.findByReviewer(options.reviewerId);
    }

    async updateResult(dto: UpdateResultDTO) {
        const resultDoc = await this.repository.findById(dto.id);
        if (!resultDoc) throw new Error("Result not found");

        await this.validateReviewerPermission(String(resultDoc.reviewer), dto.userId);
        await this.validateResult(String(resultDoc.criterion), dto.data.score, dto.data.selectedOptionId);

        // Pass update DTO data directly
        return this.repository.update(dto.id, dto.data);
    }

    async deleteResult(dto: DeleteResultDTO) {
        if (!dto.userId) throw new Error("User ID is required for deletion");

        const resultDoc = await this.repository.findById(dto.id);
        if (!resultDoc) throw new Error("Result not found");

        await this.validateReviewerPermission(String(resultDoc.reviewer), dto.userId);
        return this.repository.delete(dto.id);
    }
}

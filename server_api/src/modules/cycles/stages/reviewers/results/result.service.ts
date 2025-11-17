//result.service.ts
import { IResultRepository, ResultRepository } from "./result.repository";
import { CreateResultDTO, DeleteResultDTO, GetResultsDTO, UpdateResultDTO } from "./result.dto";
import { Reviewer } from "../reviewer.model";
import { ReviewerStatus } from "../reviewer.enum";
import { Option } from "../../../../evaluations/options/option.model";
import Applicant from "../../../../applicants/applicant.model";
import { FormType } from "../../../../evaluations/criteria/criterion.enum";
import { Criterion } from "../../../../evaluations/criteria/criterion.model";

export class ResultService {
    private repository: IResultRepository;

    constructor(repository?: IResultRepository) {
        this.repository = repository || new ResultRepository();
    }

    private async validateReviewerPermission(reviewerId: string, userId: string) {
        const reviewerDoc = await Reviewer.findById(reviewerId).lean();
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

        // Pass DTO directly to repository
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

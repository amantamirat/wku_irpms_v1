import { FormType } from "../../../../evaluations/criteria/criterion.enum";
import { Criterion } from "../../../../evaluations/criteria/criterion.model";
import { Option } from "../../../../evaluations/options/option.model";
import { Reviewer } from "../reviewer.model";
import { CreateResultDTO, GetResultsDTO, UpdateResultDTO } from "./result.dto";
import { DeleteDto } from "../../../../../util/delete.dto";
import { Result } from "./result.model";
import Applicant from "../../../../applicants/applicant.model";
import mongoose from "mongoose";
import { ReviewerStatus } from "../reviewer.enum";

export class ResultService {

    private static async validateReviwer(data: { reviewer: mongoose.Types.ObjectId, userId: string }) {
        const { reviewer, userId } = data;
        const reviewerDoc = await Reviewer.findById(reviewer).lean();
        if (!reviewerDoc) throw new Error("Reviewer not found");
        if (reviewerDoc.status !== ReviewerStatus.active) {
            throw new Error("Reviewer is not active");
        }
        const applicantDoc = await Applicant.findOne({ user: userId }).lean();
        if (!applicantDoc) throw new Error("Applicant not found");
        if (String(reviewerDoc.applicant) !== String(applicantDoc._id)) {
            throw new Error("You are not allowed to provide result for this project.")
        }
        return { reviewerDoc, applicantDoc };
    }

    private static async validateResult(data: { criterion: mongoose.Types.ObjectId, score?: number, selected_option?: mongoose.Types.ObjectId }) {
        const criterionDoc = await Criterion.findOne({ _id: data.criterion }).lean();
        if (!criterionDoc) throw new Error("Criterion not found");

        if (criterionDoc.form_type === FormType.open) {
            if (data.score === undefined || data.score === null) {
                throw new Error("Score is required");
            }
            const maxScore = criterionDoc.weight;
            if (data.score < 0 || data.score > maxScore) {
                throw new Error(`Score must be between 0 and ${maxScore}`);
            }
        }
        if (criterionDoc.form_type === FormType.closed) {
            const option = await Option.findById(data.selected_option).lean();
            if (!option || String(option.criterion) !== String(criterionDoc._id)) {
                throw new Error("Selected option not found.");
            }
        }
        return {criterionDoc};
    }

    static async createResult(dto: CreateResultDTO) {
        const { reviewer, criterion, selected_option, score, userId } = dto;
        await this.validateReviwer({ reviewer, userId });
        await this.validateResult({ criterion, score, selected_option });
        return await Result.create(dto);
    }

    static async getResults(options: GetResultsDTO) {
        const filter: any = {};
        if (options.reviewer) filter.reviewer = options.reviewer;
        return await Result.find(filter).populate("reviewer").populate("criterion").populate("selected_option").lean();
    }

    static async updateResult(dto: UpdateResultDTO) {
        const { id, data, userId } = dto;
        const { score, selected_option } = data;
        const resultDoc = await Result.findById(id);
        if (!resultDoc) throw new Error("Result not found");
        await this.validateReviwer({ reviewer: resultDoc.reviewer, userId });
        await this.validateResult({ criterion: resultDoc.criterion, score, selected_option });
        Object.assign(resultDoc, data);
        return resultDoc.save();
    }

    static async deleteResult(dto: DeleteDto) {
        const { id, userId } = dto;
        if (!userId) {
            throw new Error("User ID is required for deletion");
        }
        const resultDoc = await Result.findById(id);
        if (!resultDoc) throw new Error("Result not found");
        await this.validateReviwer({ reviewer: resultDoc.reviewer, userId });
        return await resultDoc.deleteOne();
    }
}

import mongoose from "mongoose";
import { Result } from "./result.model";
import { Criterion } from "../../call/evaluations/evaluation.model";
import { Reviewer } from "../reviewers/reviewer.model";
import { FormType } from "../../call/evaluations/evaluation.enum";

export interface CreateResultDto {
    evaluator: mongoose.Types.ObjectId;
    criterion: mongoose.Types.ObjectId;
    score: number;
    comment?: string;
    status?: string;
}

export interface GetResultOptions {
    _id?: string;
    evaluator?: string;
    criterion?: string;
}

export class ResultService {

    private static async validateResult(result: CreateResultDto) {
        const reviewer = await Reviewer.findById(result.evaluator).populate("projectStage").lean();
        if (!reviewer) throw new Error("Reviewer not found");
        const stage = (reviewer.projectStage as any).stage;
        if (!stage) throw new Error("Project stage not found");
        const criterion = await Criterion.findOne({ _id: result.criterion, parent: stage }).lean();
        if (!criterion) throw new Error("Criterion not found");
        const maxScore = criterion.weight_value;
        if (result.score < 0 || result.score > maxScore) {
            throw new Error(`Score must be between 0 and ${maxScore}`);
        }
        if (criterion.form_type === FormType.closed) {
            // For closed form, score must be from one of the predefined options
        }
    }

    static async createResult(data: CreateResultDto) {
        await this.validateResult(data);
        return await Result.create(data);
    }

    static async getResults(options: GetResultOptions) {
        const filter: any = {};
        if (options.evaluator) filter.evaluator = options.evaluator;
        if (options.criterion) filter.criterion = options.criterion;
        return await Result.find(filter).populate("evaluator").populate("criterion").lean();
    }

    static async findResult(options: GetResultOptions) {
        const filter: any = {};
        if (options._id) filter._id = options._id;
        if (options.evaluator) filter.evaluator = options.evaluator;
        if (options.criterion) filter.criterion = options.criterion;
        return await Result.findOne(filter).lean();
    }

    static async updateResult(id: string, data: Partial<CreateResultDto>) {
        const doc = await Result.findById(id);
        if (!doc) throw new Error("Result not found");
        Object.assign(doc, data);
        return await doc.save();
    }

    static async deleteResult(id: string) {
        const doc = await Result.findById(id);
        if (!doc) throw new Error("Result not found");
        return await doc.deleteOne();
    }
}

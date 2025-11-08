import mongoose from "mongoose";
import { Result } from "./result.model";
import { Reviewer } from "../reviewers/reviewer.model";
import { Criterion } from "../../evaluations/criteria/criterion.model";
import { Option } from "../../evaluations/options/option.model";
import { FormType } from "../../evaluations/criteria/criterion.enum";


export interface CreateResultDto {
    evaluator: mongoose.Types.ObjectId;
    criterion: mongoose.Types.ObjectId;
    score?: number;
    selected_option?: mongoose.Types.ObjectId;
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
        if (criterion.form_type === FormType.open) {
            if (result.score === undefined || result.score === null) {
                throw new Error("Score is required");
            }
            const maxScore = criterion.weight;
            if (result.score < 0 || result.score > maxScore) {
                throw new Error(`Score must be between 0 and ${maxScore}`);
            }
        }
        if (criterion.form_type === FormType.closed) {
            if (!result.selected_option) {
                throw new Error("Selected option is required for closed form type");
            }
            const option = await Option.findById(result.selected_option).lean();
            if (!option) {
                throw new Error("Selected option is not found.");
            }
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
        return await Result.find(filter).populate("evaluator").populate("criterion").populate("selected_option").lean();
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

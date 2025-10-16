import mongoose from "mongoose";
import { Result } from "./result.model";

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
    static async createResult(data: CreateResultDto) {
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

import { Types } from "mongoose";
import { EvalType } from "./enums/eval.type.enum";
import { FormType } from "./enums/from.type.enum";
import { Evaluation } from "./evaluation.model";

export interface GetEvalsOptions {
    type?: EvalType;
    parent?: string;
    directorate?: string;
}

export interface CreateEvaluationDto {
    type: EvalType;
    title: string;
    directorate?: Types.ObjectId;
    parent?: Types.ObjectId;
    stage_level?: number;
    weight_value?: number;
    form_type?: FormType;
}


export class EvaluationService {

    static async createEvaluation(data: CreateEvaluationDto) {
        const createdEvaluation = await Evaluation.create({ ...data });
        return createdEvaluation;
    }

    static async getEvaluations() {
        return Evaluation.find().lean();
    }

    static async updateEvaluation(id: string, data: Partial<CreateEvaluationDto>) {
        const evaluation = await Evaluation.findById(id);
        if (!evaluation) throw new Error("Evaluation not found");
        Object.assign(evaluation, data);
        return evaluation.save();
    }

    static async deleteEvaluation(id: string) {
        const evaluation = await Evaluation.findById(id);
        if (!evaluation) throw new Error("Evaluation not found");
        return await evaluation.deleteOne();
    }
}

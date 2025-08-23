import { Organization } from "@/models/organization";
import { ApiClient } from "@/api/ApiClient";
import { EvalType, Evaluation } from "../models/eval.model";

const end_point = '/evals';

function sanitizeEvaluation(evaluation: Partial<Evaluation>): Partial<Evaluation> {
    return {
        ...evaluation,
        directorate:
            typeof evaluation.directorate === 'object' && evaluation.directorate !== null
                ? (evaluation.directorate as Organization)._id
                : evaluation.directorate,
        parent:
            typeof evaluation.parent === 'object' && evaluation.parent !== null
                ? (evaluation.parent as Evaluation)._id
                : evaluation.parent,
    };
}


export interface GetEvaluationsOptions {
    type?: EvalType;
    parent?: string;
    directorate?: string;
}

export const EvaluationApi = {

    async createEvaluation(evaluation: Partial<Evaluation>): Promise<Evaluation> {
        const sanitized = sanitizeEvaluation(evaluation);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Evaluation;
    },

    async getEvaluations(options: GetEvaluationsOptions): Promise<Evaluation[]> {
        const query = new URLSearchParams();
        if (options.type) query.append("type", options.type);
        if (options.parent) query.append("parent", options.parent);
        if (options.directorate) query.append("directorate", options.directorate);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Evaluation[];
    },


    async updateEvaluation(evaluation: Partial<Evaluation>): Promise<Evaluation> {
        if (!evaluation._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${evaluation._id}`;
        const sanitized = sanitizeEvaluation(evaluation);
        const updatedEvaluation = await ApiClient.put(url, sanitized);
        return updatedEvaluation as Evaluation;
    },

    async deleteEvaluation(evaluation: Partial<Evaluation>): Promise<boolean> {
        if (!evaluation._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${evaluation._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },

    async reorderStage(evaluation: Partial<Evaluation>, direction: "up" | "down"): Promise<boolean> {
        if (!evaluation._id) throw new Error("_id is required.");
        const response = await ApiClient.put(`${end_point}/reorder/${evaluation._id}/${direction}`);
        return response;
    },
};

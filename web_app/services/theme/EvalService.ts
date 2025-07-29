import { Evaluation } from "@/models/theme/evaluation";
import { MyService } from "../MyService";

const end_point = "/eval";

function sanitizeEvaluation(evaluation: Partial<Evaluation>): Partial<Evaluation> {
    return {
        ...evaluation,
        directorate:
            typeof evaluation.directorate === "object" && evaluation.directorate !== null
                ? (evaluation.directorate as any)._id
                : evaluation.directorate,
        parent:
            typeof evaluation.parent === "object" && evaluation.parent !== null
                ? (evaluation.parent as any)._id
                : evaluation.parent,
    };
}

export const EvalService = {
    async createEvaluation(evaluation: Partial<Evaluation>): Promise<Evaluation> {
        const sanitized = sanitizeEvaluation(evaluation);
        const created = await MyService.post(end_point, sanitized);
        return created as Evaluation;
    },

    async getEvaluationsByDirectorate(directorate: string): Promise<Evaluation[]> {
        const data = await MyService.get(`${end_point}/directorate/${directorate}`);
        return data as Evaluation[];
    },

    async getEvaluationsByParent(parent: string): Promise<Evaluation[]> {
        const data = await MyService.get(`${end_point}/parent/${parent}`);
        return data as Evaluation[];
    },

    async updateEvaluation(evaluation: Partial<Evaluation>): Promise<Evaluation> {
        if (!evaluation._id) throw new Error("_id is required.");
        const sanitized = sanitizeEvaluation(evaluation);
        const updated = await MyService.put(`${end_point}/${evaluation._id}`, sanitized);
        return updated as Evaluation;
    },

    async deleteEvaluation(evaluation: Partial<Evaluation>): Promise<boolean> {
        if (!evaluation._id) throw new Error("_id is required.");
        const response = await MyService.delete(`${end_point}/${evaluation._id}`);
        return response;
    },

    async reorderStage(evaluation: Partial<Evaluation>, direction: "up" | "down"): Promise<boolean> {
        if (!evaluation._id) throw new Error("_id is required.");
        const response = await MyService.put(`${end_point}/reorder/${evaluation._id}/${direction}`);        
        return response;
    },
};

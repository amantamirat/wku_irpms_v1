import { Evaluation } from "@/models/evaluation/evaluation";
import { MyService } from "../MyService";
import { Directorate } from "@/models/directorate";

const end_point = '/evaluations/';


export const EvaluationService = {

    async getEvaluations(): Promise<Evaluation[]> {
        const data = await MyService.get(end_point);
        return data as Evaluation[];
    },

    async getEvaluationsByDirectorate(directorate: Directorate): Promise<Evaluation[]> {
        if (!directorate._id) {
            throw new Error("_id required.");
        }
        const data = await MyService.get(`${end_point}directorate/${directorate._id}`);
        return data as Evaluation[];
    },

    async createEvaluation(evaluation: Partial<Evaluation>): Promise<Evaluation> {
        const createdData = await MyService.post(end_point, evaluation);
        return createdData as Evaluation;
    },

    async updateEvaluation(evaluation: Partial<Evaluation>): Promise<Evaluation> {
        if (!evaluation._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${evaluation._id}`;
        const updatedEvaluation = await MyService.put(url, evaluation);
        return updatedEvaluation as Evaluation;
    },

    async deleteEvaluation(evaluation: Partial<Evaluation>): Promise<boolean> {
        if (!evaluation._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${evaluation._id}`;
        const response = await MyService.delete(url);
        return response;
    },
};

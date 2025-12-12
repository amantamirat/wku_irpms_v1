import { ApiClient } from "@/api/ApiClient";
import { Organization } from "../../organizations/models/organization.model";
import { Evaluation, GetEvaluationsOptions, sanitizeEvaluation } from "../models/evaluation.model";

const end_point = '/evaluations';

export const EvaluationApi = {

    async createEvaluation(evaluation: Partial<Evaluation>): Promise<Evaluation> {
        const sanitized = sanitizeEvaluation(evaluation);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Evaluation;
    },

    async getEvaluations(options: GetEvaluationsOptions): Promise<Evaluation[]> {
        const query = new URLSearchParams();
        const sanitized = sanitizeEvaluation(options);
        if (sanitized.directorate) query.append("directorate", sanitized.directorate as string);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Evaluation[];
    },

    /*
    async getUserEvaluations(): Promise<Evaluation[]> {
        const data = await ApiClient.get(`${end_point}/user`);
        return data as Evaluation[];
    },
    */

    async updateEvaluation(evaluation: Partial<Evaluation>): Promise<Evaluation> {
        if (!evaluation._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${evaluation._id}`;
        const sanitized = sanitizeEvaluation(evaluation);
        const updatedData = await ApiClient.put(url, sanitized);
        return updatedData as Evaluation;
    },

    async deleteEvaluation(evaluation: Partial<Evaluation>): Promise<boolean> {
        if (!evaluation._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${evaluation._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};

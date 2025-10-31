import { ApiClient } from "@/api/ApiClient";
import { Evaluation } from "../../evaluations/models/evaluation.model";
import { Criterion } from "../models/criterion.model";

const end_point = '/criteria';

function sanitizeCriterion(criterion: Partial<Criterion>): Partial<Criterion> {
    return {
        ...criterion,
        evaluation:
            typeof criterion.evaluation === 'object' && criterion.evaluation !== null
                ? (criterion.evaluation as Evaluation)._id
                : criterion.evaluation
    };
}

export interface GetCriteriaOptions {
    evaluation?: string;
}

export const CriterionApi = {

    async createCriterion(criterion: Partial<Criterion>): Promise<Criterion> {
        const sanitized = sanitizeCriterion(criterion);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Criterion;
    },

    async getCriteria(options: GetCriteriaOptions = {}): Promise<Criterion[]> {
        const query = new URLSearchParams();
        if (options.evaluation) query.append("evaluation", options.evaluation);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Criterion[];
    },

     async importCriteriaBatch(evaluationId: string, criteriaData: any[]): Promise<any> {
                const response = await ApiClient.post(`${end_point}/import-batch`, {
                    evaluationId: evaluationId,
                    criteriaData: criteriaData
                });
                return response;
            },

    async updateCriterion(criterion: Partial<Criterion>): Promise<Criterion> {
        if (!criterion._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${criterion._id}`;
        const sanitized = sanitizeCriterion(criterion);
        const updatedData = await ApiClient.put(url, sanitized);
        return updatedData as Criterion;
    },

    async deleteCriterion(criterion: Partial<Criterion>): Promise<boolean> {
        if (!criterion._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${criterion._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};

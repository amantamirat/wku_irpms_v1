import { ApiClient } from "@/api/ApiClient";
import { Criterion, GetCriteriaOptions, sanitizeCriterion } from "../models/criterion.model";

const end_point = '/criteria';

export const CriterionApi = {

    async create(criterion: Partial<Criterion>): Promise<Criterion> {
        const sanitized = sanitizeCriterion(criterion);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Criterion;
    },

    async getCriteria(options: GetCriteriaOptions): Promise<Criterion[]> {
        const query = new URLSearchParams();
        const sanitized = sanitizeCriterion(options);
        if (options.evaluation) query.append("evaluation", sanitized.evaluation as string);
        // if (options.stage) query.append("stage", options.stage);
        // if (options.reviewer) query.append("reviewer", options.reviewer);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Criterion[];
    },

    async importCriteriaBatch(evaluationId: string, criteriaData: any[]): Promise<any> {
        const response = await ApiClient.post(`${end_point}/import`, {
            evaluationId: evaluationId,
            criteriaData: criteriaData
        });
        return response;
    },

    async update(criterion: Partial<Criterion>): Promise<Criterion> {
        if (!criterion._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${criterion._id}`;
        const sanitized = sanitizeCriterion(criterion);
        const updatedData = await ApiClient.put(url, sanitized);
        return updatedData as Criterion;
    },

    async delete(criterion: Partial<Criterion>): Promise<boolean> {
        if (!criterion._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${criterion._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};

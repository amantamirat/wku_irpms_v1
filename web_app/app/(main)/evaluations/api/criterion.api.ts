import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { Criterion, GetCriteriaOptions, sanitize } from "../models/criterion.model";

const end_point = '/criteria';

export const CriterionApi: EntityApi<Criterion, GetCriteriaOptions> = {

    async getAll(options?: GetCriteriaOptions) {
        const query = new URLSearchParams();

        if (options) {
            const sanitized = sanitize(options);
            if (options.evaluation) query.append("evaluation", sanitized.evaluation as string);
        }

        const url = query.toString() ? `${end_point}?${query.toString()}` : end_point;
        return ApiClient.get(url);
    },

    async create(criterion) {
        const sanitized = sanitize(criterion);
        return ApiClient.post(end_point, sanitized);
    },

    async update(criterion) {
        if (!criterion._id) throw new Error("_id required");
        const sanitized = sanitize(criterion);
        return ApiClient.put(`${end_point}/${criterion._id}`, sanitized);
    },

    async delete(criterion) {
        if (!criterion._id) throw new Error("_id required");
        return ApiClient.delete(`${end_point}/${criterion._id}`);
    },

    async import(formData: FormData, evalId?: string) {
        return ApiClient.post(`${end_point}/import/${evalId}`, formData);
    }
};
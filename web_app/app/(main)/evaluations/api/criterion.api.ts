import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { Criterion, FilterCriteriaOptions } from "../models/criterion.model";
import { sanitize } from "../models/evaluation.model";

const end_point = '/criteria';

export const CriterionApi: EntityApi<Criterion, FilterCriteriaOptions> = {

    async getAll(options?: FilterCriteriaOptions) {        
        return ApiClient.get(end_point, options);
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

    /*
    async import(formData: FormData, evalId?: string) {
        return ApiClient.post(`${end_point}/import/${evalId}`, formData);
    }*/
};
import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { Evaluation, GetEvaluationsOptions } from "../models/evaluation.model";
import { StateTransition } from "@/api/EntityApi";
import { sanitize } from "@/utils/utils";

const end_point = "/evaluations";

export const EvaluationApi: EntityApi<Evaluation, GetEvaluationsOptions | undefined> = {

    async getAll(options) {
        return ApiClient.get(end_point, options);
    },

    async lookup(options) {
        return ApiClient.get(`${end_point}/lookup`, options);
    },

    async create(evaluation) {
        const sanitized = sanitize(evaluation);
        return ApiClient.post(end_point, sanitized);
    },

    async update(evaluation) {
        if (!evaluation._id) throw new Error("_id required");
        const sanitized = sanitize(evaluation);
        return ApiClient.put(`${end_point}/${evaluation._id}`, sanitized);
    },

    async delete(evaluation) {
        if (!evaluation._id) throw new Error("_id required");
        return ApiClient.delete(`${end_point}/${evaluation._id}`);
    },

    async transitionState(id: string, dto: StateTransition): Promise<any> {
        const url = `${end_point}/${id}`;
        const updated = await ApiClient.patch(url, dto);
        return updated;
    }
};
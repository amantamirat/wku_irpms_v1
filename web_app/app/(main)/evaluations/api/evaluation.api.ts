import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { Evaluation, GetEvaluationsOptions, sanitize } from "../models/evaluation.model";
import { TransitionRequestDto } from "@/types/util";

const end_point = "/evaluations";

export const EvaluationApi: EntityApi<Evaluation, GetEvaluationsOptions | undefined> = {

    async getAll(options) {
        const query = new URLSearchParams();
        if (options) {
            /*
            const sanitized = sanitize(options);
            if (sanitized.organization) {
                query.append("organization", sanitized.organization as string);
            }
            */
            if (options.populate !== undefined) {
                query.append("populate", String(options.populate));
            }
        }
        const qs = query.toString();
        return ApiClient.get(`${end_point}${qs ? `?${qs}` : ""}`);
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

    async transitionState(id: string, dto: TransitionRequestDto): Promise<any> {
        const query = new URLSearchParams();
        query.append("id", id);
        const url = `${end_point}/${id}`;
        const updated = await ApiClient.patch(url, dto);
        return updated;
    }
};
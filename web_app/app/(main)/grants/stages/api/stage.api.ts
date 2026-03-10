import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { GetStagesDTO, Stage, sanitize } from "../models/stage.model";

const end_point = "/grants/stages";

export const StageApi: EntityApi<Stage, GetStagesDTO> = {

    async getAll(options?: GetStagesDTO) {
        const query = new URLSearchParams();

        if (options) {
            const sanitized = sanitize(options);
            if (options.grant) query.append("grant", sanitized.grant as string);
        }

        const url = query.toString() ? `${end_point}?${query.toString()}` : end_point;
        return ApiClient.get(url);
    },

    async create(stage) {
        const sanitized = sanitize(stage);
        return ApiClient.post(end_point, sanitized);
    },

    async update(stage) {
        if (!stage._id) throw new Error("_id required");
        const sanitized = sanitize(stage);
        return ApiClient.put(`${end_point}/${stage._id}`, sanitized);
    },

    async delete(stage) {
        if (!stage._id) throw new Error("_id required");
        return ApiClient.delete(`${end_point}/${stage._id}`);
    },


};
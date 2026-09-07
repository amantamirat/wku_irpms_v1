import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { Position, FilterPositionOptions } from "../models/position.model";

const end_point = "/positions";

export const PositionApi: EntityApi<Position, FilterPositionOptions | undefined> = {

    async getAll(options) {
        return ApiClient.get(end_point, options);
    },

    async lookup(filter) {
        return ApiClient.get(`${end_point}/lookup`, filter);
    },

    async getById(id: string) {
        return ApiClient.get(`${end_point}/${id}`);
    },

    async create(position) {
        return ApiClient.post(end_point, position);
    },

    async update(position) {
        if (!position._id) throw new Error("_id required");
        return ApiClient.put(
            `${end_point}/${position._id}`,
            position
        );
    },

    async delete(position) {
        if (!position._id) throw new Error("_id required");
        return ApiClient.delete(`${end_point}/${position._id}`);
    }
};
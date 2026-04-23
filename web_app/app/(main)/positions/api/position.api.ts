import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { Position, sanitizePosition, GetPositionOptions } from "../models/position.model";

const end_point = "/positions";

export const PositionApi: EntityApi<Position, GetPositionOptions | undefined> = {

    async getAll(options) {
        const query = new URLSearchParams();

        if (options) {
            const sanitized = sanitizePosition(options);

            if (options.type) {
                query.append("type", sanitized.type as string);
            }

            if (options.parent) {
                query.append("parent", sanitized.parent as string);
            }
        }

        const qs = query.toString();
        return ApiClient.get(`${end_point}${qs ? `?${qs}` : ""}`);
    },

    async getById(id: string) {
        return ApiClient.get(`${end_point}/${id}`);
    },

    async create(position) {
        const sanitized = sanitizePosition(position);
        return ApiClient.post(end_point, sanitized);
    },

    async update(position) {
        if (!position._id) throw new Error("_id required");
        return ApiClient.put(`${end_point}/${position._id}`, sanitizePosition(position));
    },

    async delete(position) {
        if (!position._id) throw new Error("_id required");
        return ApiClient.delete(`${end_point}/${position._id}`);
    }
};
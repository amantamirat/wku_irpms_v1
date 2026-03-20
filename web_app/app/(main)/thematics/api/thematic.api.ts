import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { GetThematicsOptions, Thematic, sanitize } from "../models/thematic.model";
import { TransitionRequestDto } from "@/types/util";

const end_point = "/thematics";

export const ThematicApi: EntityApi<Thematic, GetThematicsOptions | undefined> = {

    async getAll(options) {
        const query = new URLSearchParams();
        if (options) {
            if (options.status) {
                query.append("status", String(options.status));
            }
        }
        const qs = query.toString();
        return ApiClient.get(`${end_point}${qs ? `?${qs}` : ""}`);
    },

    async create(thematic) {
        const sanitized = sanitize(thematic);
        return ApiClient.post(end_point, sanitized);
    },

    async update(thematic) {
        if (!thematic._id) throw new Error("_id required");
        const sanitized = sanitize(thematic);
        return ApiClient.put(`${end_point}/${thematic._id}`, sanitized);
    },

    async delete(thematic) {
        if (!thematic._id) throw new Error("_id required");
        return ApiClient.delete(`${end_point}/${thematic._id}`);
    },

    async transitionState(id: string, dto: TransitionRequestDto): Promise<any> {
        const query = new URLSearchParams();
        query.append("id", id);
        const url = `${end_point}/${id}`;
        const updated = await ApiClient.patch(url, dto);
        return updated;
    }
};
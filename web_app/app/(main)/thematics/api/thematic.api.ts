import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { GetThematicsOptions, Thematic, sanitize } from "../models/thematic.model";
import { StateTransition } from "@/api/EntityApi";

const end_point = "/thematics";

export const ThematicApi: EntityApi<Thematic, GetThematicsOptions | undefined> = {

    async getAll(filter) {
        return ApiClient.get(end_point, filter);
    },

    async lookup(filter) {
        return ApiClient.get(`${end_point}/lookup`, filter);
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

    async transitionState(id: string, dto: StateTransition): Promise<any> {
        const query = new URLSearchParams();
        query.append("id", id);
        const url = `${end_point}/${id}`;
        const updated = await ApiClient.patch(url, dto);
        return updated;
    }
};
import { EntityApi } from "@/api/EntityApi"
import { FilterGrantOptions, Grant, sanitize } from "../models/grant.model"
import { ApiClient } from "@/api/ApiClient"
import { StateTransition } from "@/api/EntityApi";

const end_point = "/grants";
export const GrantApi: EntityApi<Grant, FilterGrantOptions | undefined> = {

    async getAll(options) {
        return ApiClient.get(end_point, options);
    },

    async lookup(options) {
        return ApiClient.get(`${end_point}/lookup`, options);
    },

    async getById(id: string) {
        return ApiClient.get(`${end_point}/${id}`);
    },


    async create(grant) {
        const sanitized = sanitize(grant)
        return ApiClient.post('/grants/', sanitized)
    },

    async update(grant) {
        if (!grant._id) throw new Error("_id required")
        return ApiClient.put(`/grants/${grant._id}`, sanitize(grant))
    },

    async transitionState(id: string, dto: StateTransition): Promise<any> {
        const query = new URLSearchParams();
        query.append("id", id);
        const url = `/grants/${id}`;
        const updated = await ApiClient.patch(url, dto);
        return updated;
    },

    async delete(grant) {
        if (!grant._id) throw new Error("_id required")
        return ApiClient.delete(`/grants/${grant._id}`)
    }
}
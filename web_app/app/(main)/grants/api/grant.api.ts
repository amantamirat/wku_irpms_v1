import { EntityApi } from "@/api/EntityApi"
import { GetGrantOptions, Grant, sanitize } from "../models/grant.model"
import { ApiClient } from "@/api/ApiClient"
import { TransitionRequestDto } from "@/types/util"

const end_point = "/grants";
export const GrantApi: EntityApi<Grant, GetGrantOptions | undefined> = {

    async getAll(options) {
        const query = new URLSearchParams();
        if (options) {
            const sanitized = sanitize(options);
            if (options.status) {
                query.append("status", sanitized.status as string);
            }
            if (options.populate !== undefined) {
                query.append("populate", String(options.populate));
            }
        }
        const qs = query.toString();
        return ApiClient.get(`${end_point}${qs ? `?${qs}` : ""}`);
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

    async transitionState(id: string, dto: TransitionRequestDto): Promise<any> {
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
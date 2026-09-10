import { EntityApi } from "@/api/EntityApi"
import { Role } from "../models/role.model"
import { ApiClient } from "@/api/ApiClient"
import { sanitize } from "@/utils/sanitizer"

const end_point = "/roles";
export const RoleApi: EntityApi<Role> = {

    async getAll() {
        return ApiClient.get(end_point)
    },

    async create(role) {
        const sanitized = sanitize(role)
        return ApiClient.post(end_point, sanitized)
    },

    async update(role) {
        if (!role._id) throw new Error("_id required")
        return ApiClient.put(`${end_point}/${role._id}`, sanitize(role))
    },

    async delete(role) {
        if (!role._id) throw new Error("_id required")
        const url = `${end_point}/${role._id}`;
        return ApiClient.delete(url);
    }
}
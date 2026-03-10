import { EntityApi } from "@/api/EntityApi"
import { Role, sanitizeRole } from "../models/role.model"
import { ApiClient } from "@/api/ApiClient"

export const RoleApi: EntityApi<Role> = {

    async getAll() {
        return ApiClient.get('/roles/')
    },

    async create(role) {
        const sanitized = sanitizeRole(role)
        return ApiClient.post('/roles/', sanitized)
    },

    async update(role) {
        if (!role._id) throw new Error("_id required")
        return ApiClient.put(`/roles/${role._id}`, sanitizeRole(role))
    },

    async delete(role) {
        if (!role._id) throw new Error("_id required")
        return ApiClient.delete(`/roles/${role._id}`)
    }
}
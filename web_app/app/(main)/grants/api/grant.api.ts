import { EntityApi } from "@/api/EntityApi"
import { Grant, sanitizeGrant } from "../models/grant.model"
import { ApiClient } from "@/api/ApiClient"

export const GrantApi: EntityApi<Grant> = {

    async getAll() {
        return ApiClient.get('/grants/')
    },

    async create(grant) {
        const sanitized = sanitizeGrant(grant)
        return ApiClient.post('/grants/', sanitized)
    },

    async update(grant) {
        if (!grant._id) throw new Error("_id required")
        return ApiClient.put(`/grants/${grant._id}`, sanitizeGrant(grant))
    },

    async delete(grant) {
        if (!grant._id) throw new Error("_id required")
        return ApiClient.delete(`/grants/${grant._id}`)
    }
}
import { EntityApi } from "@/api/EntityApi"
import { FilterExperiences, Experience } from "../models/experience.model"
import { ApiClient } from "@/api/ApiClient"
import { StateTransition } from "@/api/EntityApi";
import { sanitize } from "@/utils/utils";

const end_point = "/experiences";
export const ExperienceApi: EntityApi<Experience, FilterExperiences | undefined> = {

    async getAll(options) {
        return ApiClient.get(end_point, options);
    },

    /*
    async lookup(options) {
        return ApiClient.get(`${end_point}/lookup`, options);
    },*/

    async getById(id: string) {
        return ApiClient.get(`${end_point}/${id}`);
    },


    async create(experience) {
        const sanitized = sanitize(experience)
        return ApiClient.post('/experiences/', sanitized)
    },

    async update(experience) {
        if (!experience._id) throw new Error("_id required")
        return ApiClient.put(`/experiences/${experience._id}`, sanitize(experience))
    },

    
    async transitionState(id: string, dto: StateTransition): Promise<any> {
        const query = new URLSearchParams();
        query.append("id", id);
        const url = `/experiences/${id}`;
        const updated = await ApiClient.patch(url, dto);
        return updated;
    },

    async delete(experience) {
        if (!experience._id) throw new Error("_id required")
        return ApiClient.delete(`/experiences/${experience._id}`)
    }
}
import { ApiClient } from "@/api/ApiClient";
import { Experience, GetExperiencesOptions, sanitizeExperience } from "../models/experience.model";
import { EntityApi } from "@/api/EntityApi";

const end_point = '/experiences';

export const ExperienceApi: EntityApi<Experience, GetExperiencesOptions | undefined> = {

    async getAll(options?: GetExperiencesOptions): Promise<Experience[]> {
        const query = new URLSearchParams();
        if (options) {
            const sanitized = sanitizeExperience(options);
            if (sanitized.user) query.append("user", sanitized.user as string);
        }
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Experience[];
    },

    async create(exp: Partial<Experience>): Promise<Experience> {
        const sanitized = sanitizeExperience(exp);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Experience;
    },

    async update(exp: Partial<Experience>): Promise<Experience> {
        if (!exp._id) {
            throw new Error("_id required.");
        }
        const sanitized = sanitizeExperience(exp);
        const url = `${end_point}/${exp._id}`;
        const updatedData = await ApiClient.put(url, sanitized);
        return updatedData as Experience;
    },

    async delete(exp: Partial<Experience>): Promise<boolean> {
        if (!exp._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${exp._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};

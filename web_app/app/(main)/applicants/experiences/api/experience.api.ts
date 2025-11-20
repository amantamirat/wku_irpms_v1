import { ApiClient } from "@/api/ApiClient";
import { Experience, GetExperiencesOptions, sanitizeExperience } from "../models/experience.model";

const end_point = '/experiences/';


export const ExperienceApi = {

    async getExperiences(options: GetExperiencesOptions): Promise<Experience[]> {
        const query = new URLSearchParams();
        const applicant = typeof options.applicant === "object" ? (options.applicant as any)._id : options.applicant
        if (applicant) query.append("applicant", applicant);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Experience[];
    },

    async createExperience(exp: Partial<Experience>): Promise<Experience> {
        const sanitized = sanitizeExperience(exp);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Experience;
    },

    async updateExperience(exp: Partial<Experience>): Promise<Experience> {
        if (!exp._id) {
            throw new Error("_id required.");
        }
        const sanitized = sanitizeExperience(exp);
        const url = `${end_point}${exp._id}`;
        const updatedData = await ApiClient.put(url, sanitized);
        return updatedData as Experience;
    },

    async deleteExperience(exp: Partial<Experience>): Promise<boolean> {
        if (!exp._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${exp._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};

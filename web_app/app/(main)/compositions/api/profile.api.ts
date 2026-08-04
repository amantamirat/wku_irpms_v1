import { ApiClient } from "@/api/ApiClient";
import { EligibilityProfile, sanitizeEligibilityProfile } from "../models/profile.model";
import { EntityApi } from "@/api/EntityApi";

const end_point = '/team/profiles';
export const ProfileApi: EntityApi<EligibilityProfile> = {
    async create(EligibilityProfile: Partial<EligibilityProfile>): Promise<EligibilityProfile> {
        const sanitized = sanitizeEligibilityProfile(EligibilityProfile);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as EligibilityProfile;
    },

    async getAll(populate): Promise<EligibilityProfile[]> {
        const query = new URLSearchParams();
        if (populate) query.append("populate", String(populate));
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as EligibilityProfile[];
    },

    async update(EligibilityProfile: Partial<EligibilityProfile>): Promise<EligibilityProfile> {
        if (!EligibilityProfile._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${EligibilityProfile._id}`;
        const sanitized = sanitizeEligibilityProfile(EligibilityProfile);
        const updatedEligibilityProfile = await ApiClient.put(url, sanitized);
        return updatedEligibilityProfile as EligibilityProfile;
    },

    async delete(EligibilityProfile: Partial<EligibilityProfile>): Promise<boolean> {
        if (!EligibilityProfile._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${EligibilityProfile._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};
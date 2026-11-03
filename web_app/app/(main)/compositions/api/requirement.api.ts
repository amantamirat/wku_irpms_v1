import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import { IMemberRequirement } from "../models/requirement.model";
import { sanitize } from "@/utils/utils";

const end_point = '/team/requirements';
export const MemberRequirementApi: EntityApi<IMemberRequirement> = {
    async create(data: Partial<IMemberRequirement>): Promise<IMemberRequirement> {
        const sanitized = sanitize(data);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as IMemberRequirement;
    },

    async getAll(): Promise<IMemberRequirement[]> {
        const data = await ApiClient.get(end_point);
        return data as IMemberRequirement[];
    },

    async getById(id: string): Promise<IMemberRequirement> {
        //const query = populate !== undefined ? `?populate=${populate}` : '';
        return ApiClient.get(end_point);
    },

    async update(data: Partial<IMemberRequirement>): Promise<IMemberRequirement> {
        if (!data._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${data._id}`;
        const sanitized = sanitize(data);
        const updatedMemberRequirement = await ApiClient.put(url, sanitized);
        return updatedMemberRequirement as IMemberRequirement;
    },

    async delete(data: Partial<IMemberRequirement>): Promise<boolean> {
        if (!data._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${data._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};
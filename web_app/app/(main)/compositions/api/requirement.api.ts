import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import { MemberRequirement } from "../models/requirement.model";
import { sanitize } from "@/utils/utils";

const end_point = '/team/requirements';
export const MemberRequirementApi: EntityApi<MemberRequirement> = {
    async create(data: Partial<MemberRequirement>): Promise<MemberRequirement> {
        const sanitized = sanitize(data);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as MemberRequirement;
    },

    async getAll(populate): Promise<MemberRequirement[]> {
        const data = await ApiClient.get(end_point);
        return data as MemberRequirement[];
    },

    async getById(id: string, populate?: boolean): Promise<MemberRequirement> {
        //const query = populate !== undefined ? `?populate=${populate}` : '';
        return ApiClient.get(end_point);
    },

    async update(data: Partial<MemberRequirement>): Promise<MemberRequirement> {
        if (!data._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${data._id}`;
        const sanitized = sanitize(data);
        const updatedMemberRequirement = await ApiClient.put(url, sanitized);
        return updatedMemberRequirement as MemberRequirement;
    },

    async delete(data: Partial<MemberRequirement>): Promise<boolean> {
        if (!data._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${data._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};
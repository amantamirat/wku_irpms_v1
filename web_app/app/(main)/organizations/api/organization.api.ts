import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { GetOrganizationsOptions, Organization, sanitize } from "../models/organization.model";

const end_point = "/organizations";

export const OrganizationApi: EntityApi<Organization, GetOrganizationsOptions | undefined> = {

    async getAll(options?: GetOrganizationsOptions) {
        const query = new URLSearchParams();

        if (options) {
            const sanitized = sanitize(options);
            if (sanitized.type) query.append("type", sanitized.type as string);
            if (sanitized.parent) query.append("parent", sanitized.parent as string);
        }

        const url = query.toString() ? `${end_point}?${query.toString()}` : end_point;
        return ApiClient.get(url);
    },

    async create(organization: Partial<Organization>) {
        const sanitized = sanitize(organization);
        return ApiClient.post(end_point, sanitized);
    },

    async update(organization: Partial<Organization>) {
        if (!organization._id) throw new Error("_id required");
        const sanitized = sanitize(organization);
        return ApiClient.put(`${end_point}/${organization._id}`, sanitized);
    },

    async delete(organization: Partial<Organization>) {
        if (!organization._id) throw new Error("_id required");
        return ApiClient.delete(`${end_point}/${organization._id}`, { type: organization.type });
    }
};
import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { FilterOrganization, Organization } from "../models/organization.model";
import { sanitize } from "@/utils/utils";

const end_point = "/organizations";

export const OrganizationApi: EntityApi<Organization, FilterOrganization | undefined> = {

    async getAll(options) {
        return ApiClient.get(end_point, options);
    },

    async getById(id: string) {
        return ApiClient.get(`${end_point}/${id}`);
    },

    async lookup(options) {
        return ApiClient.get(`${end_point}/lookup`, options);
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
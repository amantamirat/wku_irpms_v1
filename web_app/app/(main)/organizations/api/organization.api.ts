import { ApiClient } from "@/api/ApiClient";
import { Organization, OrgnUnit, sanitizeOrganization } from "../models/organization.model";


const end_point = '/organizations/';

export interface GetOrganizationsOptions {
    type: OrgnUnit;
    parent?: Organization;
}

export const OrganizationApi = {

    async createOrganization(organization: Partial<Organization>): Promise<Organization> {
        const sanitized = sanitizeOrganization(organization);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Organization;
    },

    async getOrganizations(options: GetOrganizationsOptions): Promise<Organization[]> {
        const query = new URLSearchParams();
        const sanitized = sanitizeOrganization(options);
        if (options.type) query.append("type", options.type);
        if (sanitized.parent) query.append("parent", sanitized.parent as string);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Organization[];
    },


    async updateOrganization(organization: Partial<Organization>): Promise<Organization> {
        if (!organization._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${organization._id}`;
        const sanitized = sanitizeOrganization(organization);
        const updatedOrganization = await ApiClient.put(url, sanitized);
        return updatedOrganization as Organization;
    },

    async deleteOrganization(organization: Partial<Organization>): Promise<boolean> {
        if (!organization._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${organization._id}`;
        const response = await ApiClient.delete(url, { type: organization.type });
        return response;
    },
};

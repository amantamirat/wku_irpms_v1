import { ApiClient } from "@/api/ApiClient";
import { Organization, OrganizationalUnit } from "../models/organization.model";


const end_point = '/organs';

function sanitizeOrganization(organization: Partial<Organization>): Partial<Organization> {
    return {
        ...organization,
        parent:
            typeof organization.parent === 'object' && organization.parent !== null
                ? (organization.parent as Organization)._id
                : organization.parent,
    };
}

export interface GetOrganizationsOptions {
    type?: OrganizationalUnit;
    parent?: string;
}

export const OrganizationApi = {

    async createOrganization(organization: Partial<Organization>): Promise<Organization> {
        const sanitized = sanitizeOrganization(organization);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Organization;
    },

    async getDirectorateByID(id: string): Promise<Organization> {
        const data = await ApiClient.get(`${end_point}/${id}`);
        return data as Organization;
    },

    async getOrganizations(options: GetOrganizationsOptions): Promise<Organization[]> {
        const query = new URLSearchParams();
        if (options.type) query.append("type", options.type);
        if (options.parent) query.append("parent", options.parent);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Organization[];
    },

    async getOrganizationsByParent(parent: string): Promise<Organization[]> {
        const data = await ApiClient.get(`${end_point}/parent/${parent}`);
        return data as Organization[];
    },

    async updateOrganization(organization: Partial<Organization>): Promise<Organization> {
        if (!organization._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${organization._id}`;
        const updatedOrganization = await ApiClient.put(url, organization);
        return updatedOrganization as Organization;
    },

    async deleteOrganization(organization: Partial<Organization>): Promise<boolean> {
        if (!organization._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${organization._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};

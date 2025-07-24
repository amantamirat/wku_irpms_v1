import { Organization, OrganizationType } from "@/models/organization";
import { MyService } from "./MyService";

const end_point = '/organizations';

function sanitizeOrganization(organization: Partial<Organization>): Partial<Organization> {
    return {
        ...organization,
        parent:
            typeof organization.parent === 'object' && organization.parent !== null
                ? (organization.parent as Organization)._id
                : organization.parent,
    };
}

export const OrganizationService = {

    async createOrganization(organization: Partial<Organization>): Promise<Organization> {
        const sanitized = sanitizeOrganization(organization);
        const createdData = await MyService.post(end_point, sanitized);
        return createdData as Organization;
    },

    async getDirectorateByID(id: string): Promise<Organization> {
        const data = await MyService.get(`${end_point}/${id}`);
        return data as Organization;
    },

    async getOrganizationsByType(type: OrganizationType): Promise<Organization[]> {
        const data = await MyService.get(`${end_point}/type/${type}`);
        return data as Organization[];
    },

    async getOrganizationsByParent(parent: string): Promise<Organization[]> {
        const data = await MyService.get(`${end_point}/parent/${parent}`);
        return data as Organization[];
    },

    async updateOrganization(organization: Partial<Organization>): Promise<Organization> {
        if (!organization._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${organization._id}`;
        const updatedOrganization = await MyService.put(url, organization);
        return updatedOrganization as Organization;
    },

    async deleteOrganization(organization: Partial<Organization>): Promise<boolean> {
        if (!organization._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${organization._id}`;
        const response = await MyService.delete(url);
        return response;
    },
};

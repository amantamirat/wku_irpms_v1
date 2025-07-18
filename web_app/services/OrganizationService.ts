import { Organization, OrganizationType } from "@/models/organization";
import { MyService } from "./MyService";

const end_point = '/organizations/';


export const OrganizationService = {

    async getOrganizations(type: OrganizationType): Promise<Organization[]> {
        const data = await MyService.get(`${end_point}${type}`);
        return data as Organization[];
    },

    async createOrganization(organization: Partial<Organization>): Promise<Organization> {
        const createdData = await MyService.post(end_point, organization);
        return createdData as Organization;
    },

    async updateOrganization(organization: Partial<Organization>): Promise<Organization> {
        if (!organization._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${organization._id}`;
        const updatedOrganization = await MyService.put(url, organization);
        return updatedOrganization as Organization;
    },

    async deleteOrganization(organization: Partial<Organization>): Promise<boolean> {
        if (!organization._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${organization._id}`;
        const response = await MyService.delete(url);
        return response;
    },
};

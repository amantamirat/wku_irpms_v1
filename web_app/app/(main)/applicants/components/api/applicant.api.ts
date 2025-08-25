import { Applicant } from "@/models/applicant";
import { Category, Organization } from "@/app/(main)/organizations/models/organization.model";
import { ApiClient } from "@/api/ApiClient";

const end_point = '/applicants/';


function sanitizeApplicant(applicant: Partial<Applicant>): Partial<Applicant> {
    return {
        ...applicant,
        organization:
            typeof applicant.organization === 'object' && applicant.organization !== null
                ? (applicant.organization as Organization)._id
                : applicant.organization,
    };
}

export interface GetApplicantsOptions {
    organization?: string;
    scope?: Category;
}


export const ApplicantApi = {

    async createApplicant(applicant: Partial<Applicant>): Promise<Applicant> {
        const sanitized = sanitizeApplicant(applicant);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Applicant;
    },

    async getApplicants(options: GetApplicantsOptions): Promise<Applicant[]> {
        const query = new URLSearchParams();
        if (options.scope) query.append("scope", options.scope);
        if (options.organization) query.append("organization", options.organization);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Applicant[];
    },   

    async updateApplicant(applicant: Partial<Applicant>): Promise<Applicant> {
        if (!applicant._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${applicant._id}`;
        const updatedApplicant = await ApiClient.put(url, applicant);
        return updatedApplicant as Applicant;
    },

    async deleteApplicant(applicant: Partial<Applicant>): Promise<boolean> {
        if (!applicant._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${applicant._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};

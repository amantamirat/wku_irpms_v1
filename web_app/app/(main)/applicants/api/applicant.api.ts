import { ApiClient } from "@/api/ApiClient";
import { Applicant, GetApplicantsOptions, sanitizeApplicant } from "../models/applicant.model";


const end_point = '/applicants';

export const ApplicantApi = {

    async create(applicant: Partial<Applicant>): Promise<Applicant> {
        const sanitized = sanitizeApplicant(applicant);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Applicant;
    },

    async getApplicants(options: GetApplicantsOptions): Promise<Applicant[]> {
        const query = new URLSearchParams();
        const sanitized = sanitizeApplicant(options);
        if (sanitized.workspace) {
            query.append("workspace", sanitized.workspace as string);
            /*
             if (Array.isArray(options.workspace)) {
                 query.append("organization", options.workspace.join(',')); // comma-separated
             } else {
                 
             }
            */
        }
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Applicant[];
    },

    async update(applicant: Partial<Applicant>): Promise<Applicant> {
        if (!applicant._id) {
            throw new Error("_id required.");
        }
        const sanitized = sanitizeApplicant(applicant);
        const url = `${end_point}/${applicant._id}`;
        const updatedApplicant = await ApiClient.put(url, sanitized);
        return updatedApplicant as Applicant;
    },


    async updateRoles(applicant: Partial<Applicant>): Promise<Applicant> {
        if (!applicant._id) throw new Error("_id required.");
        const sanitized = sanitizeApplicant(applicant);
        const url = `${end_point}/${applicant._id}/roles`;
        const updatedApplicant = await ApiClient.put(url, sanitized);
        return updatedApplicant as Applicant;
    },

    async updateOwnerships(id: string, applicant: Partial<Applicant>): Promise<Applicant> {
        const sanitized = sanitizeApplicant(applicant);
        const url = `${end_point}/${id}/ownerships`;
        const updatedApplicant = await ApiClient.put(url, sanitized);
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

    async linkApplicant(applicant: Partial<Applicant>): Promise<Applicant> {
        if (!applicant._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${applicant._id}`;
        const response = await ApiClient.patch(url);
        return response as Applicant;
    },
};

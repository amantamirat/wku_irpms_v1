import { Applicant } from "@/models/applicant";
import { MyService } from "./MyService";
import { Category } from "@/app/(main)/organizations/models/organization.model";

const end_point = '/applicants/';

export const ApplicantService = {

    async getApplicants(): Promise<Applicant[]> {
        const data = await MyService.get(end_point);
        return data as Applicant[];
    },

    async getApplicantsByScope(scope: Category): Promise<Applicant[]> {
        const data = await MyService.get(`${end_point}${scope}`);
        return data as Applicant[];
    },

    async createApplicant(applicant: Partial<Applicant>): Promise<Applicant> {
        const createdData = await MyService.post(end_point, applicant);
        return createdData as Applicant;
    },

    async updateApplicant(applicant: Partial<Applicant>): Promise<Applicant> {
        if (!applicant._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${applicant._id}`;
        const updatedApplicant = await MyService.put(url, applicant);
        return updatedApplicant as Applicant;
    },

    async deleteApplicant(applicant: Partial<Applicant>): Promise<boolean> {
        if (!applicant._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${applicant._id}`;
        const response = await MyService.delete(url);
        return response;
    },
};

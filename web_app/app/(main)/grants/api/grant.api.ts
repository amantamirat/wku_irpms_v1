import { ApiClient } from "@/api/ApiClient";
import { Grant } from "../models/grant.model";
import { Calendar } from "../../calendars/models/calendar.model";
import { Evaluation } from "../../evals/models/eval.model";
import { Theme } from "../../themes/models/theme.model";
import { Organization } from "../../organizations/models/organization.model";


const end_point = '/grants';

function sanitizeGrant(grant: Partial<Grant>): Partial<Grant> {
    return {
        ...grant,
        directorate:
            typeof grant.directorate === 'object' && grant.directorate !== null
                ? (grant.directorate as Organization)._id
                : grant.directorate,
        evaluation:
            typeof grant.evaluation === 'object' && grant.evaluation !== null
                ? (grant.evaluation as Evaluation)._id
                : grant.evaluation,
        theme:
            typeof grant.theme === 'object' && grant.theme !== null
                ? (grant.theme as Theme)._id
                : grant.theme,
    };
}

export interface GetGrantsOptions {
    directorate?: string;
}

export const GrantApi = {

    async createGrant(grant: Partial<Grant>): Promise<Grant> {
        const sanitized = sanitizeGrant(grant);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Grant;
    },

    async getGrants(options: GetGrantsOptions): Promise<Grant[]> {
        const query = new URLSearchParams();
        if (options.directorate) query.append("directorate", options.directorate);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Grant[];
    },


    async updateGrant(grant: Partial<Grant>): Promise<Grant> {
        if (!grant._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${grant._id}`;
        const sanitized = sanitizeGrant(grant);
        const updatedGrant = await ApiClient.put(url, sanitized);
        return updatedGrant as Grant;
    },

    async deleteGrant(grant: Partial<Grant>): Promise<boolean> {
        if (!grant._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${grant._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};

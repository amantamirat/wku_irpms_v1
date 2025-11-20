import { ApiClient } from "@/api/ApiClient";
import { GetReviewersOptions, Reviewer, sanitizeReviewer } from "../models/reviewer.model";

const end_point = '/project/reviewers/';


export const ReviewerApi = {

    async getReviewers(options: GetReviewersOptions): Promise<Reviewer[]> {
        const query = new URLSearchParams();
        const sanitized = sanitizeReviewer(options);
        if (sanitized.applicant) query.append("applicant", sanitized.applicant as string);
        if (sanitized.projectStage) query.append("projectStage", sanitized.projectStage as string);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Reviewer[];
    },

    async createReviewer(reviewer: Partial<Reviewer>): Promise<Reviewer> {
        const sanitized = sanitizeReviewer(reviewer);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Reviewer;
    },

    async updateReviewer(reviewer: Partial<Reviewer>, changeStatus = false): Promise<any> {
        if (!reviewer._id) {
            throw new Error("_id required.");        }

        const sanitized = sanitizeReviewer(reviewer);

        // URL points to /reviewers/:id or /reviewers/:id/status
        const url = changeStatus
            ? `${end_point}${reviewer._id}/status`
            : `${end_point}${reviewer._id}`;

        const updatedReviewer = await ApiClient.put(url, sanitized);
        return updatedReviewer as Reviewer;
    },


    async deleteReviewer(reviewer: Partial<Reviewer>): Promise<boolean> {
        if (!reviewer._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${reviewer._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};

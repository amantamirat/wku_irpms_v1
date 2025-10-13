import { ApiClient } from "@/api/ApiClient";
import { Reviewer } from "../models/reviewer.model";
const end_point = '/project/reviewers/';

export interface GetReviewersOptions {
    applicant?: string;
    projectStage?: string;
}

export const ReviewerApi = {
    async getReviewers(options: GetReviewersOptions): Promise<Reviewer[]> {
        const query = new URLSearchParams();
        if (options.applicant) query.append("applicant", options.applicant);
        if (options.projectStage) query.append("projectStage", options.projectStage);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Reviewer[];
    },

    async createReviewer(reviewer: Partial<Reviewer>): Promise<Reviewer> {
        const createdData = await ApiClient.post(end_point, reviewer);
        return createdData as Reviewer;
    },

    async updateReviewer(reviewer: Partial<Reviewer>): Promise<Reviewer> {
        if (!reviewer._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${reviewer._id}`;
        const updatedReviewer = await ApiClient.put(url, reviewer);
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

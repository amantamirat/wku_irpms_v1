import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import { TransitionRequestDto } from "@/types/util";
import {
    GetReviewersOptions,
    Reviewer,
    sanitizeReviewer
} from "../models/reviewer.model";

const end_point = '/project/reviewers';

export const ReviewerApi: EntityApi<Reviewer, GetReviewersOptions | undefined> = {

    async getAll(options?: GetReviewersOptions): Promise<Reviewer[]> {
        const query = new URLSearchParams();

        if (options) {
            const sanitized = sanitizeReviewer(options);

            // Map 'reviewer' to the 'reviewer' query param (Check if your backend expects 'reviewer' or 'applicant')
            if (sanitized.reviewer) {
                query.append("reviewer", sanitized.reviewer as string);
            }

            if (sanitized.projectStage) {
                query.append("projectStage", sanitized.projectStage as string);
            }

            // NEW: Handle Status Array or String
            if (options.status) {
                if (Array.isArray(options.status)) {
                    // Append each status individually for standard URL array handling
                    options.status.forEach(s => query.append("status", s));
                } else {
                    query.append("status", options.status);
                }
            }

            if (options.populate !== undefined) {
                query.append("populate", String(options.populate));
            }
        }

        const url = query.toString()
            ? `${end_point}?${query.toString()}`
            : end_point;

        const data = await ApiClient.get(url);
        return data as Reviewer[];
    },

    async getById(id: string): Promise<Reviewer> {
        const url = `${end_point}/${id}`;
        const data = await ApiClient.get(url);
        return data as Reviewer;
    },

    async create(reviewer: Partial<Reviewer>): Promise<Reviewer> {
        const sanitized = sanitizeReviewer(reviewer);
        const created = await ApiClient.post(end_point, sanitized);
        return created as Reviewer;
    },

    async update(reviewer: Partial<Reviewer>): Promise<Reviewer> {
        //if (!reviewer._id) throw new Error("_id required");
        const sanitized = sanitizeReviewer(reviewer);
        const url = `${end_point}/${reviewer._id}`;
        const updated = await ApiClient.put(url, sanitized);

        return updated as Reviewer;
    },

    async delete(reviewer: Partial<Reviewer>): Promise<boolean> {
        //if (!reviewer._id) throw new Error("_id required");
        const url = `${end_point}/${reviewer._id}`;
        return await ApiClient.delete(url);
    },

    async transitionState(id: string, dto: TransitionRequestDto): Promise<Reviewer> {
        const url = `${end_point}/${id}`;
        const updated = await ApiClient.patch(url, dto);
        return updated as Reviewer;
    }
};
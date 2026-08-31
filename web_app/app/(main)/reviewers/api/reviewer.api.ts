import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import { TransitionRequestDto } from "@/types/util";
import {
    FilterReviewersOptions,
    Reviewer,
    sanitizeReviewer
} from "../models/reviewer.model";

const end_point = '/project/reviewers';

export const ReviewerApi: EntityApi<Reviewer, FilterReviewersOptions | undefined>
    & {

        me: (options?: FilterReviewersOptions) => Promise<Reviewer[]>;

    }
    = {

    async getAll(filter?: FilterReviewersOptions): Promise<Reviewer[]> {

        /*
                if (options) {            
                    // NEW: Handle Status Array or String
                    if (options.status) {
                        if (Array.isArray(options.status)) {
                            options.status.forEach(s => query.append("status", s));
                        } 
                    }           
                }*/
        const data = await ApiClient.get(end_point, filter);
        return data as Reviewer[];
    },

    async me(
        filter?: Omit<FilterReviewersOptions, "reviewer">
    ): Promise<Reviewer[]> {
        const data = await ApiClient.get(`${end_point}/me`, filter);
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
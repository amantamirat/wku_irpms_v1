import { ApiClient } from "@/api/ApiClient";
import { EntityApi, StateTransition } from "@/api/EntityApi";
import { sanitize } from "@/utils/utils";
import {
    Application,
    FilterApplicationOptions
} from "../models/application.model";

const end_point = "/project/applications";

export const ApplicationApi: EntityApi<
    Application,
    FilterApplicationOptions | undefined
> & {
    anonymize: (id: string) => Promise<Application>;
    //withdraw: (id: string) => Promise<boolean>;
    updateReviewerAssigner: (
        id: string,
        reviewerAssigner: string | null
    ) => Promise<Application>;

    getMyAssignedApplications: (
        options?: FilterApplicationOptions
    ) => Promise<Application[]>;
} = {

    // ---------------------------
    // Fetch / Query
    // ---------------------------
    async getAll(options) {
        return ApiClient.get(end_point, options);
    },

    async lookup(options) {
        return ApiClient.get(`${end_point}/lookup`, options);
    },

    // ---------------------------
    // Get By Id
    // ---------------------------
    async getById(id: string): Promise<Application> {
        return ApiClient.get(`${end_point}/${id}`);
    },

    async getMyAssignedApplications(options) {
        return ApiClient.get(
            `${end_point}/my-assigned`,
            options
        );
    },

    // ---------------------------
    // Create
    // ---------------------------
    async create(application: Partial<Application>): Promise<any> {
        const formData = new FormData();

        // 1. Separate the file if it exists (using your backend's expected "document" key)
        if (application.file) {
            formData.append("file", application.file);
        }

        // 2. Separate the file out so sanitize only runs on metadata
        const { file, ...applicationWithoutFile } = application;
        const sanitized = sanitize(applicationWithoutFile);

        // 3. Wrap the rest of the application data into a single stringified JSON object
        formData.append("application", JSON.stringify(sanitized));

        return ApiClient.post(`${end_point}`, formData);
    },

    // ---------------------------
    // Update
    // ---------------------------
    async update(application) {
        return ApiClient.put(
            `${end_point}/${application._id}`,
            sanitize(application)
        );
    },

    // ---------------------------
    // Reviewer Assigner
    // ---------------------------
    async updateReviewerAssigner(
        id: string,
        reviewerAssigner: string | null
    ): Promise<Application> {
        return ApiClient.patch(
            `${end_point}/${id}/reviewer-assigner`,
            {
                reviewerAssigner
            }
        );
    },

    // ---------------------------
    // Transition State
    // ---------------------------
    async transitionState(
        id: string,
        dto: StateTransition
    ): Promise<any> {
        return ApiClient.patch(
            `${end_point}/${id}/transition`,
            dto
        );
    },

    // ---------------------------
    // Anonymize
    // ---------------------------
    async anonymize(id: string): Promise<Application> {
        return ApiClient.post(
            `${end_point}/${id}/anonymize`,
            {}
        );
    },

    // ---------------------------
    // Withdraw
    // ---------------------------
    /*
    async withdraw(id: string): Promise<boolean> {
        return ApiClient.post(
            `${end_point}/${id}/withdraw`,
            {}
        );
    },
    */

    // ---------------------------
    // Delete
    // ---------------------------
    async delete(application) {
        return ApiClient.delete(
            `${end_point}/${application._id}`
        );
    },
};
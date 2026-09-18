import { ApiClient } from "@/api/ApiClient";
import { EntityApi, StateTransition } from "@/api/EntityApi";
import { sanitize } from "@/utils/utils";
import { Application, FilterApplicationOptions } from "../models/application.model";

const end_point = "/project/applications";

export const ApplicationApi: EntityApi<Application, FilterApplicationOptions | undefined>
    & {
        anonymize: (id: string) => Promise<Application>;
        withdraw: (id: string) => Promise<boolean>;
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

    // ---------------------------
    // Create
    // ---------------------------
    async create(application) {
        const sanitized = sanitize(application);
        const formData = new FormData();
        formData.append("project", sanitized.project as string);
        formData.append("stage", sanitized.stage as string);
        if (application.file)
            formData.append("document", application.file);
        return ApiClient.post(`${end_point}`, formData);
    },


    

    // ---------------------------
    // Update
    // ---------------------------
    async update(application) {
        // if (!stage._id) throw new Error("_id required");
        return ApiClient.put(`${end_point}/${application._id}`, sanitize(application));
    },

    // ---------------------------
    // Transition State
    // ---------------------------
    async transitionState(id: string, dto: StateTransition): Promise<any> {
        const url = `${end_point}/${id}/transition`;
        return ApiClient.patch(url, dto);
    },

    /*
    async calculateTotalScore(id: string): Promise<number> {
        const res = await ApiClient.post(`${end_point}/${id}/calculate-score`, {});
        return res.totalScore;
    },*/

    async anonymize(id) {
        return ApiClient.post(
            `${end_point}/${id}/anonymize`, {}
        );
    },

    async withdraw(id) {
        return ApiClient.post(
            `${end_point}/${id}/withdraw`, {}
        );
    },

    // ---------------------------
    // Delete
    // ---------------------------
    async delete(application) {
        return ApiClient.delete(`${end_point}/${application._id}`);
    },
};
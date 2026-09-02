import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import { TransitionRequestDto } from "@/types/util";
import { GetProjectApplicationOptions, Application, sanitizeApplication } from "../models/application.model";
import { Project } from "../../projects/models/project.model";
import { sanitize } from "@/utils/sanitizer";

const end_point = "/project/applications";

export const ApplicationApi: EntityApi<Application, GetProjectApplicationOptions | undefined>
    & {
        //calculateTotalScore: (id: string) => Promise<number>;
        anonymize: (id: string) => Promise<Application>;
        apply: (project: Partial<Project>) => Promise<Application>;
        withdraw: (id: string) => Promise<boolean>;
    } = {

    // ---------------------------
    // Fetch / Query
    // ---------------------------
    async getAll(options, populate) {
        return ApiClient.get(end_point, options);
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


    async apply(project: Partial<Project>): Promise<Application> {
        const formData = new FormData();
        const sanitized = sanitize(project);

        // 1. Separate the file from the rest of the data
        if (project.file) {
            // Backend usually expects 'document' or 'file' - 
            // Based on your controller, make sure Multer is configured for this key
            formData.append("file", project.file);
            delete project.file;
        }

        // 2. Wrap the REST of the project data into a single stringified JSON object
        // This satisfies: project = JSON.parse(req.body.project);
        formData.append("project", JSON.stringify(sanitized));

        const created = await ApiClient.post(`${end_point}/apply`, formData);
        return created as Application;
    },

    // ---------------------------
    // Update
    // ---------------------------
    async update(application) {
        // if (!stage._id) throw new Error("_id required");
        return ApiClient.put(`${end_point}/${application._id}`, sanitizeApplication(application));
    },

    // ---------------------------
    // Transition State
    // ---------------------------
    async transitionState(id: string, dto: TransitionRequestDto): Promise<any> {
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
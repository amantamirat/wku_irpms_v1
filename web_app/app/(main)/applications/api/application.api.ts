import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import { TransitionRequestDto } from "@/types/util";
import { GetProjectApplicationOptions, Application, sanitizeProjectApplication } from "../models/application.model";
import { Project, sanitize } from "../../projects/models/project.model";

const end_point = "/project/applications";



export const ApplicationApi: EntityApi<Application, GetProjectApplicationOptions | undefined>
    & {
        calculateTotalScore: (id: string) => Promise<number>;
        apply: (project: Partial<Project>) => Promise<Application>;
    } = {

    // ---------------------------
    // Fetch / Query
    // ---------------------------
    async getAll(options) {
        const query = new URLSearchParams();

        if (options) {
            const sanitized = sanitizeProjectApplication(options);

            if (options.project) {
                query.append("project", sanitized.project as string);
            }

            if (options.stage) {
                query.append("stage", sanitized.stage as string);
            }

            /*
            if (options.grantAllocation) {
                query.append("grantAllocation", options.grantAllocation);
            }

            if (options.callStage) {
                query.append("callStage", sanitized.callStage as string);
            }
                */

            if (options.status) {
                query.append("status", sanitized.status as string);
            }

            if (options.populate !== undefined) {
                query.append("populate", String(options.populate));
            }
        }

        const qs = query.toString();
        return ApiClient.get(`${end_point}${qs ? `?${qs}` : ""}`);
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
    async create(stage) {
        const sanitized = sanitizeProjectApplication(stage);
        const formData = new FormData();
        formData.append("project", sanitized.project as string);
        if (stage.file)
            formData.append("document", stage.file);
        return ApiClient.post(`${end_point}`, formData);
    },


    async apply(project: Partial<Project>): Promise<Application> {
        const formData = new FormData();
        const sanitized = sanitize(project);

        // 1. Separate the file from the rest of the data
        if (sanitized.file) {
            // Backend usually expects 'document' or 'file' - 
            // Based on your controller, make sure Multer is configured for this key
            formData.append("file", sanitized.file);
            delete sanitized.file;
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
    async update(stage) {
        // if (!stage._id) throw new Error("_id required");
        return ApiClient.put(`${end_point}/${stage._id}`, sanitizeProjectApplication(stage));
    },

    // ---------------------------
    // Transition State
    // ---------------------------
    async transitionState(id: string, dto: TransitionRequestDto): Promise<any> {
        const url = `${end_point}/${id}/transition`;
        return ApiClient.patch(url, dto);
    },

    async calculateTotalScore(id: string): Promise<number> {
        const res = await ApiClient.post(`${end_point}/${id}/calculate-score`, {});
        return res.totalScore;
    },
    // ---------------------------
    // Delete
    // ---------------------------
    async delete(stage) {
        //if (!stage._id) throw new Error("_id required");
        return ApiClient.delete(`${end_point}/${stage._id}`);
    },
};
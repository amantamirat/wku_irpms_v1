import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import { TransitionRequestDto } from "@/types/util";
import { GetProjectStageOptions, ProjectStage, sanitizeProjectStage } from "../models/project.stage.model";

const end_point = "/project/stages";

export const ProjectStageApi: EntityApi<ProjectStage, GetProjectStageOptions | undefined> = {

    // ---------------------------
    // Fetch / Query
    // ---------------------------
    async getAll(options) {
        const query = new URLSearchParams();

        if (options) {
            const sanitized = sanitizeProjectStage(options);

            if (options.project) {
                query.append("project", sanitized.project as string);
            }

            if (options.grantStage) {
                query.append("grantStage", sanitized.grantStage as string);
            }

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
    async getById(id: string): Promise<ProjectStage> {
        return ApiClient.get(`${end_point}/${id}`);
    },

    // ---------------------------
    // Create
    // ---------------------------
    async create(stage) {
        const sanitized = sanitizeProjectStage(stage);
        const formData = new FormData();
        formData.append("project", sanitized.project as string);
        if (stage.file)
            formData.append("document", stage.file);
        return ApiClient.post(`${end_point}`, formData);
    },

    // ---------------------------
    // Update
    // ---------------------------
    async update(stage) {
        // if (!stage._id) throw new Error("_id required");
        return ApiClient.put(`${end_point}/${stage._id}`, sanitizeProjectStage(stage));
    },

    // ---------------------------
    // Transition State
    // ---------------------------
    async transitionState(id: string, dto: TransitionRequestDto): Promise<any> {
        const url = `${end_point}/${id}`;
        return ApiClient.patch(url, dto);
    },
    // ---------------------------
    // Delete
    // ---------------------------
    async delete(stage) {
        //if (!stage._id) throw new Error("_id required");
        return ApiClient.delete(`${end_point}/${stage._id}`);
    },
};
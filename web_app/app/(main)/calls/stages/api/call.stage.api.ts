import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import { CallStage, GetCallStagesDTO, sanitizeCallStage } from "../models/call.stage.model";
import { TransitionRequestDto } from "@/types/util";

const end_point = "/call/stages";

export const CallStageApi: EntityApi<CallStage, GetCallStagesDTO | undefined> = {

    // ---------------------------
    // Fetch / Query
    // ---------------------------
    async getAll(options) {
        const query = new URLSearchParams();

        if (options) {
            const sanitized = sanitizeCallStage(options);

            if (options.call) {
                query.append("call", sanitized.call as string);
            }

            if (options.grantStage) {
                query.append("grantStage", sanitized.grantStage as string);
            }

            if (sanitized.order !== undefined) {
                query.append("order", String(sanitized.order));
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
    async getById(id: string): Promise<CallStage> {
        return ApiClient.get(`${end_point}/${id}`);
    },

    // ---------------------------
    // Create
    // ---------------------------
    async create(stage) {
        const sanitized = sanitizeCallStage(stage);
        return ApiClient.post(`${end_point}`, sanitized);
    },

    // ---------------------------
    // Update
    // ---------------------------
    async update(stage) {
        if (!stage._id) throw new Error("_id required");
        return ApiClient.put(`${end_point}/${stage._id}`, sanitizeCallStage(stage));
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
        if (!stage._id) throw new Error("_id required");
        return ApiClient.delete(`${end_point}/${stage._id}`);
    },
};
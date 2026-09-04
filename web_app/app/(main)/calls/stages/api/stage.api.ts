import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import { Stage, GetStagesDTO, sanitizeCallStage } from "../models/stage.model";
import { TransitionRequestDto } from "@/types/util";

const end_point = "/call/stages";

export const StageApi: EntityApi<Stage, GetStagesDTO | undefined>
    & {
        getNext: (stageId: string) => Promise<Stage | null>;
        getUpcoming: () => Promise<Stage[]>;
    }
    = {

    // ---------------------------
    // Fetch / Query
    // ---------------------------
    async getAll(options) {
        return ApiClient.get(end_point, options);
    },

    // ---------------------------
    // Get By Id
    // ---------------------------
    async getById(id: string): Promise<Stage> {
        return ApiClient.get(`${end_point}/${id}`);
    },


    async getNext(id: string): Promise<Stage | null> {
        try {
            return await ApiClient.get(`${end_point}/next/${id}`);
        } catch (err: any) {
            if (err.message === "NEXT_STAGE_NOT_FOUND") {
                // return null;
            }
            //console.log(err.code);
            if (err.code === "NEXT_STAGE_NOT_FOUND") {
                return null;
            }
            throw err;
        }
    },

    async getUpcoming(): Promise<Stage[]> {
        return ApiClient.get(`${end_point}/upcoming`);
    },

    /*
        async getFirstStage(callId: string): Promise<Stage> {
            return ApiClient.get(`${end_point}/first-stage/${callId}`);
        },*/

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
        // if (!stage._id) throw new Error("_id required");
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
        //if (!stage._id) throw new Error("_id required");
        return ApiClient.delete(`${end_point}/${stage._id}`);
    },
};
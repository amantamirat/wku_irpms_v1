import { ApiClient } from "@/api/ApiClient";
import { GetStagesDTO, Stage, sanitizeStage } from "../models/stage.model";

const end_point = "/call/stages";

export const StageApi = {
    
    async create(stage: Partial<Stage>): Promise<Stage> {
        const sanitized = sanitizeStage(stage);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Stage;
    },

    async getStages(options: GetStagesDTO): Promise<Stage[]> {
        const query = new URLSearchParams();
        const sanitized = sanitizeStage(options);
        if (options.call) query.append("call", sanitized.call as string);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Stage[];
    },

    async update(stage: Partial<Stage>, changeStatus = false): Promise<Stage> {
        if (!stage._id) {
            throw new Error("_id required.");
        }
        const url = changeStatus
            ? `${end_point}/${stage._id}/status`
            : `${end_point}${stage._id}`;
        const sanitized = sanitizeStage(stage);
        const updatedStage = await ApiClient.put(url, sanitized);
        return updatedStage as Stage;
    },

    async delete(stage: Partial<Stage>): Promise<boolean> {
        if (!stage._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${stage._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};

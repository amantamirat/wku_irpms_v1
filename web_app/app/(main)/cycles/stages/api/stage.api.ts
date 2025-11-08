import { ApiClient } from "@/api/ApiClient";
import { Stage, sanitizeStage } from "../models/stage.model";

const end_point = "/call/stages";

export interface GetStagesDTO {
    cycle?: string;
}

export const StageApi = {
    async createStage(stage: Partial<Stage>): Promise<Stage> {
        const sanitized = sanitizeStage(stage);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Stage;
    },

    async getStages(options: GetStagesDTO): Promise<Stage[]> {
        const query = new URLSearchParams();
        if (options.cycle) query.append("cycle", options.cycle);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Stage[];
    },

    async updateStage(stage: Partial<Stage>): Promise<Stage> {
        if (!stage._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${stage._id}`;
        const sanitized = sanitizeStage(stage);
        const updatedStage = await ApiClient.put(url, sanitized);
        return updatedStage as Stage;
    },

    async deleteStage(stage: Partial<Stage>): Promise<boolean> {
        if (!stage._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${stage._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};

import { Stage } from "@/models/evaluation/stage";
import { MyService } from "../MyService";
import { Evaluation } from "@/models/evaluation/evaluation";

const end_point = '/stages/';

export const StageService = {

    async getStages(): Promise<Stage[]> {
        const data = await MyService.get(end_point);
        return data as Stage[];
    },

    async getStagesByEvaluation(evaluation: Evaluation): Promise<Stage[]> {
        if (!evaluation._id) {
            throw new Error("_id required.");
        }
        const data = await MyService.get(`${end_point}evaluation/${evaluation._id}`);
        return data as Stage[];
    },

    async createStage(stage: Partial<Stage>): Promise<Stage> {
        const createdData = await MyService.post(end_point, stage);
        return createdData as Stage;
    },

    async updateStage(stage: Partial<Stage>): Promise<Stage> {
        if (!stage._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${stage._id}`;
        const updatedStage = await MyService.put(url, stage);
        return updatedStage as Stage;
    },

    async deleteStage(stage: Partial<Stage>): Promise<boolean> {
        if (!stage._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${stage._id}`;
        const response = await MyService.delete(url);
        return response;
    },
};

import { Weight } from "@/models/evaluation/weight";
import { MyService } from "../MyService";
import { Stage } from "@/models/evaluation/stage";

const end_point = '/weights/';


export const WeightService = {

    async getWeights(): Promise<Weight[]> {
        const data = await MyService.get(end_point);
        return data as Weight[];
    },

    async getWeightsByStage(stage: Stage): Promise<Weight[]> {
        if (!stage._id) {
            throw new Error("_id required.");
        }
        const data = await MyService.get(`${end_point}stage/${stage._id}`);
        return data as Weight[];
    },

    async createWeight(weight: Partial<Weight>): Promise<Weight> {
        const createdData = await MyService.post(end_point, weight);
        return createdData as Weight;
    },

    async updateWeight(weight: Partial<Weight>): Promise<Weight> {
        if (!weight._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${weight._id}`;
        const updatedWeight = await MyService.put(url, weight);
        return updatedWeight as Weight;
    },

    async deleteWeight(weight: Partial<Weight>): Promise<boolean> {
        if (!weight._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${weight._id}`;
        const response = await MyService.delete(url);
        return response;
    },
};

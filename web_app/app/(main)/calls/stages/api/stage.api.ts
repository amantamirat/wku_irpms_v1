import { ApiClient } from "@/api/ApiClient";
import { GetStagesDTO, Stage, StageStatus, sanitizeStage } from "../models/stage.model";

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
        if (options.status) query.append("status", options.status as string);
        if (options.order) query.append("order", String(options.order));
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Stage[];
    },

    async update(stage: Partial<Stage>): Promise<Stage> {
        if (!stage._id) throw new Error("_id required.");
        const query = new URLSearchParams();
        query.append("id", stage._id);
        const sanitized = sanitizeStage(stage);
        const updated = await ApiClient.put(`${end_point}?${query.toString()}`, sanitized);
        return updated as Stage;
    },

    async updateStatus(id: string, status: StageStatus): Promise<any> {
        const query = new URLSearchParams();
        query.append("id", id);
        const url = `${end_point}/${id}`;
        const updated = await ApiClient.patch(url, { status });
        return updated;
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

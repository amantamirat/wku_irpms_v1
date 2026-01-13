import { ApiClient } from "@/api/ApiClient";
import { GetPhaseOptions, Phase, PhaseStatus, sanitizePhase } from "../models/phase.model";

const end_point = '/project/phases';


export const PhaseApi = {

    async getPhases(options: GetPhaseOptions): Promise<Phase[]> {
        const query = new URLSearchParams();
        const sanitized = sanitizePhase(options);
        if (sanitized.project) query.append("project", sanitized.project as string);
        if (sanitized.project) query.append("parent", sanitized.parent as string);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Phase[];
    },

    async create(phase: Partial<Phase>): Promise<Phase> {
        const createdData = await ApiClient.post(end_point, sanitizePhase(phase));
        return createdData as Phase;
    },

    async update(phase: Partial<Phase>): Promise<Phase> {
        if (!phase._id) throw new Error("_id required.");
        const query = new URLSearchParams();
        query.append("id", phase._id);
        const url = `${end_point}?${query.toString()}`;
        const sanitized = sanitizePhase(phase);
        const updatedPhase = await ApiClient.put(url, sanitized);
        return updatedPhase as Phase;
    },

    async updateStatus(id: string, status: PhaseStatus): Promise<any> {
        const query = new URLSearchParams();
        query.append("id", id);
        const url = `${end_point}/${id}`;
        const updated = await ApiClient.patch(url, { status });
        return updated;
    },

    async delete(phase: Partial<Phase>): Promise<boolean> {
        if (!phase._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${phase._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};

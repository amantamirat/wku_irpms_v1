import { ApiClient } from "@/api/ApiClient";
import { Phase } from "../models/phase.model";
import { Project } from "../../models/project.model";


const end_point = '/project/phases';


function sanitizePhase(phase: Partial<Phase>): Partial<Phase> {
    return {
        ...phase,
        project:
            typeof phase.project === "object" && phase.project !== null
                ? (phase.project as Project)._id
                : phase.project,
        parent:
            typeof phase.parent === "object" && phase.parent !== null
                ? (phase.parent as Phase)._id
                : phase.parent,
    };
}

export interface GetPhaseOptions {
    project?: string;
}

export const PhaseApi = {

    async getPhases(options: GetPhaseOptions): Promise<Phase[]> {
        const query = new URLSearchParams();
        if (options.project) query.append("project", options.project);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Phase[];
    },

    async createPhase(phase: Partial<Phase>): Promise<Phase> {
        const createdData = await ApiClient.post(end_point, sanitizePhase(phase));
        return createdData as Phase;
    },

    async updatePhase(phase: Partial<Phase>): Promise<Phase> {
        if (!phase._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${phase._id}`;
        const updatedPhase = await ApiClient.put(url, sanitizePhase(phase));
        return updatedPhase as Phase;
    },

    async deletePhase(phase: Partial<Phase>): Promise<boolean> {
        if (!phase._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${phase._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};

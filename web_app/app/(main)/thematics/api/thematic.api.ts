import { ApiClient } from "@/api/ApiClient";
import { GetThematicsOptions, Thematic, sanitizeThematic } from "../models/thematic.model";

const end_point = '/thematics';

export const ThematicApi = {

    async createThematic(thematic: Partial<Thematic>): Promise<Thematic> {
        const sanitized = sanitizeThematic(thematic);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Thematic;
    },

    async getThematics(options: GetThematicsOptions): Promise<Thematic[]> {
        const query = new URLSearchParams();
        const sanitized = sanitizeThematic(options);
        if (sanitized.directorate) query.append("directorate", sanitized.directorate as string);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Thematic[];
    },

    async updateThematic(thematic: Partial<Thematic>): Promise<Thematic> {
        if (!thematic._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${thematic._id}`;
        const sanitized = sanitizeThematic(thematic);
        const updatedThematic = await ApiClient.put(url, sanitized);
        return updatedThematic as Thematic;
    },

    async deleteThematic(thematic: Partial<Thematic>): Promise<boolean> {
        if (!thematic._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${thematic._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};

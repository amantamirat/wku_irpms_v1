import { ApiClient } from "@/api/ApiClient";
import { Position, sanitizePosition, PositionType } from "../models/position.model";

const end_point = "/positions/";

export interface GetPositionOptions {
    type?: PositionType;
    parent?: string;
}

export const PositionApi = {
    
    async getPositions(options: GetPositionOptions = {}): Promise<Position[]> {
        const query = new URLSearchParams();
        if (options.type) query.append("type", options.type);
        if (options.parent) query.append("parent", options.parent);

        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Position[];
    },

    async createPosition(position: Partial<Position>): Promise<Position> {
        const createdData = await ApiClient.post(end_point, sanitizePosition(position));
        return createdData as Position;
    },

    async updatePosition(position: Partial<Position>): Promise<Position> {
        if (!position._id) {
            throw new Error("_id is required for updating a position.");
        }
        const url = `${end_point}${position._id}`;
        const updated = await ApiClient.put(url, sanitizePosition(position));
        return updated as Position;
    },

    async deletePosition(position: Partial<Position>): Promise<boolean> {
        if (!position._id) {
            throw new Error("_id is required for deleting a position.");
        }
        const url = `${end_point}${position._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};

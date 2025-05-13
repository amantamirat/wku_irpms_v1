import { Position } from "@/models/position";
import { MyService } from "./MyService";

const end_point = '/positions/';


export const PositionService = {

    async getPositions(): Promise<Position[]> {
        const data = await MyService.get(end_point);
        return data as Position[];
    },

    async createPosition(rank: Partial<Position>): Promise<Position> {
        const createdData = await MyService.post(end_point, rank);
        return createdData as Position;
    },

    async updatePosition(rank: Partial<Position>): Promise<Position> {
        if (!rank._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${rank._id}`;
        const updatedPosition = await MyService.put(url, rank);
        return updatedPosition as Position;
    },

    async deletePosition(rank: Partial<Position>): Promise<boolean> {
        if (!rank._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${rank._id}`;
        const response = await MyService.delete(url);
        return response;
    },
};

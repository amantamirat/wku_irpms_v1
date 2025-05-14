import { Rank } from "@/models/rank";
import { MyService } from "./MyService";
import { Category } from "@/models/position";

const end_point = '/ranks/';


export const RankService = {

    async getRanks(): Promise<Rank[]> {
        const data = await MyService.get(end_point);
        return data as Rank[];
    },

    async getRanksByCategory(category: Category): Promise<Rank[]> {
        const data = await MyService.get(`${end_point}${category}`);
        return data as Rank[];
    },

    async createRank(rank: Partial<Rank>): Promise<Rank> {
        const createdData = await MyService.post(end_point, rank);
        return createdData as Rank;
    },

    async updateRank(rank: Partial<Rank>): Promise<Rank> {
        if (!rank._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${rank._id}`;
        const updatedRank = await MyService.put(url, rank);
        return updatedRank as Rank;
    },

    async deleteRank(rank: Partial<Rank>): Promise<boolean> {
        if (!rank._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${rank._id}`;
        const response = await MyService.delete(url);
        return response;
    },
};

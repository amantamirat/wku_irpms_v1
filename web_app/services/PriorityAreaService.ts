import { PriorityArea } from "@/models/priorityArea";
import { MyService } from "./MyService";
import { Theme } from "@/models/theme";

const end_point = '/priorityAreas/';


export const PriorityAreaService = {

    async getPriorityAreas(): Promise<PriorityArea[]> {
        const data = await MyService.get(end_point);
        return data as PriorityArea[];
    },

    async getPriorityAreasByTheme(theme: Theme): Promise<PriorityArea[]> {
        if (!theme._id) {
            throw new Error("_id required.");
        }
        const data = await MyService.get(`${end_point}theme/${theme._id}`);
        return data as PriorityArea[];
    },

    async createPriorityArea(priorityArea: Partial<PriorityArea>): Promise<PriorityArea> {
        const createdData = await MyService.post(end_point, priorityArea);
        return createdData as PriorityArea;
    },

    async updatePriorityArea(priorityArea: Partial<PriorityArea>): Promise<PriorityArea> {
        if (!priorityArea._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${priorityArea._id}`;
        const updatedPriorityArea = await MyService.put(url, priorityArea);
        return updatedPriorityArea as PriorityArea;
    },

    async deletePriorityArea(priorityArea: Partial<PriorityArea>): Promise<boolean> {
        if (!priorityArea._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${priorityArea._id}`;
        const response = await MyService.delete(url);
        return response;
    },
};

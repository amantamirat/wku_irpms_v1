import { SubArea } from "@/models/subArea";
import { MyService } from "./MyService";
import { Theme } from "@/models/theme";
import { PriorityArea } from "@/models/priorityArea";

const end_point = '/subAreas/';


export const SubAreaService = {

    async getSubAreas(): Promise<SubArea[]> {
        const data = await MyService.get(end_point);
        return data as SubArea[];
    },

    async getSubAreasByPriorityArea(priorityArea: PriorityArea): Promise<SubArea[]> {
        if (!priorityArea._id) {
            throw new Error("_id required.");
        }
        const data = await MyService.get(`${end_point}priorityArea/${priorityArea._id}`);
        return data as SubArea[];
    },

    async createSubArea(subArea: Partial<SubArea>): Promise<SubArea> {
        const createdData = await MyService.post(end_point, subArea);
        return createdData as SubArea;
    },

    async updateSubArea(subArea: Partial<SubArea>): Promise<SubArea> {
        if (!subArea._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${subArea._id}`;
        const updatedSubArea = await MyService.put(url, subArea);
        return updatedSubArea as SubArea;
    },

    async deleteSubArea(subArea: Partial<SubArea>): Promise<boolean> {
        if (!subArea._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${subArea._id}`;
        const response = await MyService.delete(url);
        return response;
    },
};

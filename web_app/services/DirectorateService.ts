import { Directorate } from "@/models/directorate";
import { MyService } from "./MyService";

const end_point = '/directorates/';


export const DirectorateService = {

    async getDirectorates(): Promise<Directorate[]> {
        const data = await MyService.get(end_point);
        return data as Directorate[];
    },

    async getDirectorateByID(id: string): Promise<Directorate> {
        const data = await MyService.get(`${end_point}${id}`);
        return data as Directorate;
    },

    async createDirectorate(directorate: Partial<Directorate>): Promise<Directorate> {
        const createdData = await MyService.post(end_point, directorate);
        return createdData as Directorate;
    },

    async updateDirectorate(directorate: Partial<Directorate>): Promise<Directorate> {
        if (!directorate._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${directorate._id}`;
        const updatedDirectorate = await MyService.put(url, directorate);
        return updatedDirectorate as Directorate;
    },

    async deleteDirectorate(directorate: Partial<Directorate>): Promise<boolean> {
        if (!directorate._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${directorate._id}`;
        const response = await MyService.delete(url);
        return response;
    },
};

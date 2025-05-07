import { Specialization } from "@/models/specialization";
import { MyService } from "./MyService";
import { Department } from "@/models/department";

const end_point = '/specializations/';


export const SpecializationService = {

    async getSpecializations(): Promise<Specialization[]> {
        const data = await MyService.get(end_point);
        return data as Specialization[];
    },

    async getSpecializationsByDepartment(department: Department): Promise<Specialization[]> {
        if (!department._id) {
            throw new Error("_id required.");
        }
        const data = await MyService.get(`${end_point}${department._id}`);
        return data as Specialization[];
    },

    async createSpecialization(specialization: Partial<Specialization>): Promise<Specialization> {
        const createdData = await MyService.post(end_point, specialization);
        return createdData as Specialization;
    },

    async updateSpecialization(specialization: Partial<Specialization>): Promise<Specialization> {
        if (!specialization._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${specialization._id}`;
        const updatedSpecialization = await MyService.put(url, specialization);
        return updatedSpecialization as Specialization;
    },

    async deleteSpecialization(specialization: Partial<Specialization>): Promise<boolean> {
        if (!specialization._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${specialization._id}`;
        const response = await MyService.delete(url);
        return response;
    },
};

import { ApiClient } from "@/api/ApiClient";
import { Specialization } from "../models/specialization.model";
import { EntityApi } from "@/api/EntityApi";
const end_point = '/specializations/';

export const SpecializationApi: EntityApi<Specialization> = {

    async create(specialization: Partial<Specialization>): Promise<Specialization> {
        const createdData = await ApiClient.post(end_point, specialization);
        return createdData as Specialization;
    },

    async getAll(): Promise<Specialization[]> {
        const data = await ApiClient.get(end_point);
        return data as Specialization[];
    },

    async update(specialization: Partial<Specialization>): Promise<Specialization> {
        if (!specialization._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${specialization._id}`;
        const updatedSpecialization = await ApiClient.put(url, specialization);
        return updatedSpecialization as Specialization;
    },

    async delete(specialization: Partial<Specialization>): Promise<boolean> {
        if (!specialization._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${specialization._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};

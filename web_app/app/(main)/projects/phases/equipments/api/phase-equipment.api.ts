import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { FilterPhaseEquipmentOptions, PhaseEquipment } from "../models/phase-equipment.model";
import { StateTransition } from "@/api/EntityApi";
import { sanitize } from "@/utils/utils";

const end_point = "/project/phases/equipments";

export const PhaseEquipmentApi: EntityApi<PhaseEquipment, FilterPhaseEquipmentOptions | undefined> = {

    async getAll(options?: FilterPhaseEquipmentOptions): Promise<PhaseEquipment[]> {
        const data = await ApiClient.get(end_point, options);
        return data as PhaseEquipment[];
    },

    /*
    async lookup(options) {
        return ApiClient.get(`${end_point}/lookup`, options);
    },*/

    async getById(id: string): Promise<PhaseEquipment> {
        const url = `${end_point}/${id}`;
        const data = await ApiClient.get(url);
        return data as PhaseEquipment;
    },

    async create(equipment: Partial<PhaseEquipment>): Promise<PhaseEquipment> {
        const sanitized = sanitize(equipment);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as PhaseEquipment;
    },

    async update(equipment: Partial<PhaseEquipment>): Promise<PhaseEquipment> {
        if (!equipment._id) throw new Error("_id required");

        const sanitized = sanitize(equipment);
        const url = `${end_point}/${equipment._id}`;

        const updatedEquipment = await ApiClient.put(url, sanitized);
        return updatedEquipment as PhaseEquipment;
    },

    async delete(equipment: Partial<PhaseEquipment>): Promise<boolean> {
        if (!equipment._id) throw new Error("_id required");

        const url = `${end_point}/${equipment._id}`;
        return await ApiClient.delete(url);
    },

    async transitionState(id: string, dto: StateTransition): Promise<PhaseEquipment> {
        const url = `${end_point}/${id}`;
        const updated = await ApiClient.patch(url, dto);
        return updated as PhaseEquipment;
    }
};
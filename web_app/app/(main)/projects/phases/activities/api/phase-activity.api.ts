import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { FilterPhaseActivityOptions, PhaseActivity } from "../models/phase-activity.model";
import { StateTransition } from "@/api/EntityApi";
import { sanitize } from "@/utils/utils";

const end_point = "/project/phases/activities";

export const PhaseActivityApi: EntityApi<PhaseActivity, FilterPhaseActivityOptions | undefined> = {

    async getAll(options?: FilterPhaseActivityOptions): Promise<PhaseActivity[]> {
        const data = await ApiClient.get(end_point, options);
        return data as PhaseActivity[];
    },


    async lookup(options) {
        return ApiClient.get(`${end_point}/lookup`, options);
    },

    async getById(id: string): Promise<PhaseActivity> {
        const url = `${end_point}/${id}`;
        const data = await ApiClient.get(url);
        return data as PhaseActivity;
    },

    async create(activity: Partial<PhaseActivity>): Promise<PhaseActivity> {
        const sanitized = sanitize(activity);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as PhaseActivity;
    },

    async update(activity: Partial<PhaseActivity>): Promise<PhaseActivity> {
        if (!activity._id) throw new Error("_id required");

        const sanitized = sanitize(activity);
        const url = `${end_point}/${activity._id}`;

        const updatedActivity = await ApiClient.put(url, sanitized);
        return updatedActivity as PhaseActivity;
    },

    async delete(activity: Partial<PhaseActivity>): Promise<boolean> {
        if (!activity._id) throw new Error("_id required");

        const url = `${end_point}/${activity._id}`;
        return await ApiClient.delete(url);
    },

    async transitionState(id: string, dto: StateTransition): Promise<PhaseActivity> {
        const url = `${end_point}/${id}`;
        const updated = await ApiClient.patch(url, dto);
        return updated as PhaseActivity;
    }
};
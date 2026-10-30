import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { FilterActivitiesOptions, Activity } from "../models/phase-activity.model";
import { StateTransition } from "@/api/EntityApi";
import { sanitize } from "@/utils/utils";

const end_point = "/project/phases/activities";

export const ActivityApi: EntityApi<Activity, FilterActivitiesOptions | undefined> = {

    async getAll(options?: FilterActivitiesOptions): Promise<Activity[]> {
        const data = await ApiClient.get(end_point, options);
        return data as Activity[];
    },


    async lookup(options) {
        return ApiClient.get(`${end_point}/lookup`, options);
    },

    async getById(id: string): Promise<Activity> {
        const url = `${end_point}/${id}`;
        const data = await ApiClient.get(url);
        return data as Activity;
    },

    async create(activity: Partial<Activity>): Promise<Activity> {
        const sanitized = sanitize(activity);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Activity;
    },

    async update(activity: Partial<Activity>): Promise<Activity> {
        if (!activity._id) throw new Error("_id required");

        const sanitized = sanitize(activity);
        const url = `${end_point}/${activity._id}`;

        const updatedActivity = await ApiClient.put(url, sanitized);
        return updatedActivity as Activity;
    },

    async delete(activity: Partial<Activity>): Promise<boolean> {
        if (!activity._id) throw new Error("_id required");

        const url = `${end_point}/${activity._id}`;
        return await ApiClient.delete(url);
    },

    async transitionState(id: string, dto: StateTransition): Promise<Activity> {
        const url = `${end_point}/${id}`;
        const updated = await ApiClient.patch(url, dto);
        return updated as Activity;
    }
};
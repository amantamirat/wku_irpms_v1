import { ApiClient } from "@/api/ApiClient";

import { GetGrantsOptions, Grant, sanitizeGrant } from "../models/grant.model";


const end_point = '/grants';



export const GrantApi = {

    async createGrant(grant: Partial<Grant>): Promise<Grant> {
        const sanitized = sanitizeGrant(grant);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Grant;
    },

    /*
    async getById(id: string): Promise<Grant> {
        //const url = `${end_point}/${id}`;
        //const data = await ApiClient.get(url);
        //return data as Grant;
        throw Error("not implemented");
    },
    */

    async getGrants(options: GetGrantsOptions): Promise<Grant[]> {
        const query = new URLSearchParams();
        const sanitized = sanitizeGrant(options);
        if (sanitized.organization) query.append("directorate", sanitized.organization as string);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Grant[];
    },

    async getUserGrants(): Promise<Grant[]> {
        const data = await ApiClient.get(`${end_point}/user`);
        return data as Grant[];
    },

    async updateGrant(grant: Partial<Grant>): Promise<Grant> {
        if (!grant._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${grant._id}`;
        const sanitized = sanitizeGrant(grant);
        const updatedGrant = await ApiClient.put(url, sanitized);
        return updatedGrant as Grant;
    },

    async deleteGrant(grant: Partial<Grant>): Promise<boolean> {
        if (!grant._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${grant._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};

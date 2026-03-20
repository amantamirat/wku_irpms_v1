import { ApiClient } from "@/api/ApiClient";
import { Permission } from "../models/permission.model";
import { EntityApi } from "@/api/EntityApi";

const end_point = '/permissions';

export const PermissionApi: EntityApi<Permission> = {
    async getAll(): Promise<Permission[]> {
        const data = await ApiClient.get(end_point);
        return data as Permission[];
    },
    create: function (data: Partial<Permission>): Promise<Permission> {
        throw new Error("Function not implemented.");
    },
    update: function (data: Partial<Permission>): Promise<Permission> {
        throw new Error("Function not implemented.");
    },
    delete: function (item: Permission): Promise<boolean> {
        if (!item._id) throw new Error("_id required")
        return ApiClient.delete(`${end_point}/${item._id}`)
    }
};

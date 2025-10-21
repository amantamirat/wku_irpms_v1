import { ApiClient } from "@/api/ApiClient";
import { Permission } from "../model/permission.model";

const end_point = '/permissions/';

export const PermissionApi = {

    async getPermissions(): Promise<Permission[]> {
        const data = await ApiClient.get(end_point);
        return data as Permission[];
    }
};

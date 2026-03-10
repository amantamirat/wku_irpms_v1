import { createEntityManager } from "@/components/createEntityManager";
import { RoleApi } from "../api/RoleApi";
import { Role } from "../models/role.model";
import SaveDialog from "./SaveDialog";

export const createEmptyRole = (): Role => ({
    name: "",
    permissions: [],
    isDefault: false
})

export default createEntityManager<Role>({
    title: "Manage Roles",
    itemName: "Role",
    api: RoleApi,
    columns: [
        { header: "Name", field: "name" },
        { header: "Permissions", body: (r: Role) => r.permissions?.length ?? 0 }
    ],
    createNew: createEmptyRole,
    SaveDialog,
    permissionPrefix: "role"
})
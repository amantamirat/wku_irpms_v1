import { createEntityManager } from "@/components/createEntityManager";
import { Role } from "../models/role.model";
import SaveRole from "./SaveRole";
import { RoleApi } from "../api/role.api";

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
        { header: "Name", field: "name", sortable: true },
        { header: "Permissions", body: (r: Role) => r.permissions?.length ?? 0 }
    ],
    createNew: createEmptyRole,
    SaveDialog: SaveRole,
    permissionPrefix: "role"
})
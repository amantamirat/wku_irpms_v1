import { createEmptyRole, Role } from "../models/role.model";
import SaveRole from "./SaveRole";
import { RoleApi } from "../api/role.api";
import { createEntityManager } from "@/components/data-table/createEntityManager";


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
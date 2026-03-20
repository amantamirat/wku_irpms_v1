import { createEntityManager } from "@/components/createEntityManager";
import { PermissionApi } from "../api/permission.api";
import { Permission } from "../models/permission.model";
import SavePermission from "./SavePermission";

export default createEntityManager<Permission>({
    title: "Manage Pemissions",
    itemName: "Premission",
    api: PermissionApi,
    columns: [
        { header: "Category", field: "category", sortable: true },
        { header: "Name", field: "name", sortable: true },
        {
            header: "Description",
            field: "description",
            style: { fontSize: '0.85rem', color: '#666' },
            sortable: true
        }
    ],
    SaveDialog: SavePermission,
    permissionPrefix: "permission"
})
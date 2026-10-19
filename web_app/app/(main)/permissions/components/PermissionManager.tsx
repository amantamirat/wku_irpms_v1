'use client';

import { ColumnProps } from "primereact/column";
import { ItemManager } from "@/components/ItemManager";
import { useToast } from "@/contexts/ToastContext";
import { PermissionApi } from "../api/permission.api";
import { Permission } from "../models/permission.model";
import PermissionForm from "./PermissionForm";
import { MENU_ICONS } from "@/utils/menu-icons";

// Defined outside the component so the reference stays stable between renders
const columns: ColumnProps[] = [
    { header: "Category", field: "category", sortable: true },
    { header: "Name", field: "name", sortable: true },
    {
        header: "Description",
        field: "description",
        style: { fontSize: "0.85rem", color: "#666" },
        sortable: true,
    },
];

export default function PermissionManager() {
    const toast = useToast();

    return (
        <ItemManager<Permission>
            api={PermissionApi}
            resource="permission"
            itemName="Permission"
            headerTitle="Manage Permissions"
            itemIcon={MENU_ICONS.permissions}
            columns={columns}
            renderForm={(props) => <PermissionForm {...props} />}
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(operation === "create" ? "Permission created" : "Permission updated")
            }
        />
    );
}

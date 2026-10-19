'use client';

import { ColumnProps } from "primereact/column";
import { ItemManager, ItemManagerProps } from "@/components/ItemManager";
import { useToast } from "@/contexts/ToastContext";
import { RoleApi } from "../api/role.api";
import { Role } from "../models/role.model";
import RoleDetail from "./RoleDetail";
import RoleForm from "./RoleForm";
import { MENU_ICONS } from "@/utils/menu-icons";

// Defined outside the component so the references stay stable between renders
const columns: ColumnProps[] = [
    { header: "Name", field: "name", sortable: true },
    { header: "Permissions", body: (r: Role) => r.permissions?.length ?? 0 },
];

const tableProps: ItemManagerProps<Role>["tableProps"] = {
    expandable: {
        template: (role) => <RoleDetail roleId={role._id!} />,
    },
};

// Keep the permission ids the user picked: the API response may not echo them back
const mapSaved = (saved: Role, submitted: Partial<Role>): Role => ({
    ...saved,
    permissions: submitted.permissions ?? saved.permissions,
});

export default function RoleManager() {
    const toast = useToast();

    return (
        <ItemManager<Role>
            api={RoleApi}
            resource="role"
            itemName="Role"
            headerTitle="Manage Roles"
            itemIcon={MENU_ICONS.roles}
            columns={columns}
            tableProps={tableProps}
            dialogWidth="40rem"
            renderForm={(props) => <RoleForm {...props} />}
            mapSaved={mapSaved}
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(operation === "create" ? "Role created" : "Role updated")
            }
        />
    );
}

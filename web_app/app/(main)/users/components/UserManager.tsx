'use client';
import { useState } from "react";
import { createEntityManager } from "@/components/createEntityManager";
import { User, createEmptyUser, GetUsersOptions } from "../models/user.model";
import { UserApi } from "../api/user.api";
import RoleDialog from "./dialogs/RoleDialog"; // The component we refactored
import MyBadge from "@/templates/MyBadge";
import SaveUser from "./SaveUser";
import { Badge } from "primereact/badge";

// We need a small wrapper to handle the local state of the Role Dialog
const ManageUsers = () => {
    const [roleDialogVisible, setRoleDialogVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const EntityManager = createEntityManager<User, GetUsersOptions>({
        title: "Manage Users",
        itemName: "User",
        api: UserApi,
        columns: [
            { header: "Full Name", field: "name", sortable: true },
            { header: "Workspace", field: "workspace.name" },
            /*{
                header: "FIN",
                field: "fin"
            },*/
            {
                header: "Birth Date",
                field: "birthDate",
                body: (u: User) => u.birthDate ? new Date(u.birthDate).toLocaleDateString() : '-'
            },
            {
                header: "Gender",
                field: "gender",
                body: (u: User) => <MyBadge type="gender" value={u.gender ?? "N/A"} />
            },
            {
                header: "Specs Count",
                field: "specializations.length",
                body: (u: User) => (
                    <div className="flex align-items-center">
                        <Badge
                            value={u.specializations?.length || 0}
                            severity={u.specializations?.length ? 'info' : 'warning'}
                        />
                        <span className="ml-2 text-sm text-500">Items</span>
                    </div>
                )
            },
            {
                header: "Roles",
                field: "roles",
                body: (u: User) => (
                    <div className="flex gap-1">
                        {u.roles?.length ? (
                            <Badge value={`${u.roles.length} Roles`} />
                        ) : (
                            <span className="text-gray-400 text-xs">No Roles</span>
                        )}
                    </div>
                )
            }
        ],
        query: () => ({ populate: true }),
        createNew: createEmptyUser,
        SaveDialog: SaveUser,
        permissionPrefix: "user",

        // ADD THE EXTRA ACTION HERE
        extraActions: [
            {
                icon: "pi pi-shield",
                severity: "info", // Purple color
                tooltip: "Manage Roles",
                permissions: ["user:role:update"],
                onClick: (row: User) => {
                    setSelectedUser(row);
                    setRoleDialogVisible(true);
                }
            }
        ]
    });

    // Return the manager + the custom dialog
    return (
        <>
            <EntityManager />

            {(selectedUser && roleDialogVisible) && (
                <RoleDialog
                    visible={roleDialogVisible}
                    item={selectedUser}
                    onHide={() => {
                        setRoleDialogVisible(false);
                        setSelectedUser(null);
                    }}
                    onComplete={(updatedUser) => {
                        setRoleDialogVisible(false);
                        //window.location.reload();
                    }}
                />
            )}
        </>
    );
};

export default ManageUsers;
'use client';

import { useState } from "react";

import {
    FilterUsersOptions,
    User,
    createEmptyUser
} from "../models/user.model";

import { UserApi } from "../api/user.api";
import RoleDialog from "./dialogs/RoleDialog";
import MyBadge from "@/templates/MyBadge";
import SaveUser from "./SaveUser";
import { Badge } from "primereact/badge";
import UserDetail from "./UserDetail";

import { createEntityManager } from "@/components/data-table/createEntityManager";
import { useAuth } from "@/contexts/auth-context";
import ScopeDialog from "./dialogs/ScopeDialog";

const ManageUsers = () => {

    const [roleDialogVisible, setRoleDialogVisible] = useState(false);
    const [scopeDialogVisible, setScopeDialogVisible] = useState(false);

    const [selectedUser, setSelectedUser] =
        useState<User | null>(null);

    const { hasPermission } = useAuth();

    const EntityManager =
        createEntityManager<User, FilterUsersOptions>({
            title: "Manage Users",
            itemName: "User",

            api: UserApi,

            columns: [
                {
                    header: "Full Name",
                    field: "name",
                    sortable: true
                },

                {
                    header: "Workspace",
                    field: "workspace.name"
                },

                {
                    header: "Birth Date",
                    field: "birthDate",
                    body: (u: User) =>
                        u.birthDate
                            ? new Date(
                                u.birthDate
                            ).toLocaleDateString()
                            : '-'
                },

                {
                    header: "Gender",
                    field: "gender",
                    body: (u: User) => (
                        <MyBadge
                            type="gender"
                            value={u.gender ?? "N/A"}
                        />
                    )
                },

                {
                    header: "Specs Count",
                    field: "specializations.length",
                    body: (u: User) => (
                        <div className="flex align-items-center">
                            <Badge
                                value={
                                    u.specializations?.length || 0
                                }
                                severity={
                                    u.specializations?.length
                                        ? 'info'
                                        : 'warning'
                                }
                            />

                            <span className="ml-2 text-sm text-500">
                                Items
                            </span>
                        </div>
                    )
                },

                {
                    header: "Roles",
                    field: "roles",
                    body: (u: User) => (
                        <div className="flex gap-1">
                            {u.roles?.length ? (
                                <Badge
                                    value={`${u.roles.length} Roles`}
                                />
                            ) : (
                                <span className="text-gray-400 text-xs">
                                    No Roles
                                </span>
                            )}
                        </div>
                    )
                },

                {
                    header: "Scope",
                    field: "scope",
                    body: (u: User) => {

                        if (u.scope === "*") {
                            return (
                                <MyBadge
                                    type="status"
                                    value="Full Access"
                                />
                            );
                        }

                        if (u.scope) {
                            return (
                                <div className="flex align-items-center gap-2">
                                    <MyBadge
                                        type="status"
                                        value={
                                            u.unitType ?? "Scoped"
                                        }
                                    />
                                </div>
                            );
                        }

                        return (
                            <span className="text-gray-400 text-xs">
                                No Scope
                            </span>
                        );
                    }
                }
            ],

            createNew: createEmptyUser,

            SaveDialog: SaveUser,

            permissionPrefix: "user",

            expandable: {
                template: (user) => (
                    <UserDetail user={user} />
                )
            },

            extraRowActions: [

                /*
                 * Manage Roles
                 */
                {
                    icon: "pi pi-shield",
                    severity: "info",
                    tooltip: "Manage Roles",

                    visible: () =>
                        hasPermission(
                            "user:role:update"
                        ),

                    onClick: (row: User) => {
                        setSelectedUser(row);
                        setRoleDialogVisible(true);
                    }
                },

                /*
                 * Manage Organizational Scope
                 */
                {
                    icon: "pi pi-sitemap",
                    severity: "warning",
                    tooltip: "Manage Scope",

                    visible: () =>
                        hasPermission(
                            "user:scope:update"
                        ),

                    onClick: (row: User) => {
                        setSelectedUser(row);
                        setScopeDialogVisible(true);
                    }
                }
            ]
        });

    return (
        <>
            <EntityManager />

            {selectedUser && roleDialogVisible && (
                <RoleDialog
                    visible={roleDialogVisible}
                    item={selectedUser}

                    onHide={() => {
                        setRoleDialogVisible(false);
                        setSelectedUser(null);
                    }}

                    onComplete={() => {
                        setRoleDialogVisible(false);
                        setSelectedUser(null);
                    }}
                />
            )}

            {selectedUser && scopeDialogVisible && (
                <ScopeDialog
                    visible={scopeDialogVisible}
                    item={selectedUser}

                    onHide={() => {
                        setScopeDialogVisible(false);
                        setSelectedUser(null);
                    }}

                    onComplete={() => {
                        setScopeDialogVisible(false);
                        setSelectedUser(null);
                    }}
                />
            )}
        </>
    );
};

export default ManageUsers;
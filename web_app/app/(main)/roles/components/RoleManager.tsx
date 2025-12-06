'use client';

import { CrudManager } from "@/components/CrudManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import { useEffect, useState } from "react";

import { RoleApi } from "../api/role.api";
import { Role } from "../models/role.model";
import SaveDialog from "./SaveDialog";
import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";


const RoleManager = () => {

    const emptyRole: Role = {
        name: "",
        permissions: []
    };

    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    const canCreate = hasPermission([PERMISSIONS.ROLE.CREATE]);
    const canEdit = hasPermission([PERMISSIONS.ROLE.UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.ROLE.DELETE]);

    // CRUD hook
    const {
        items: roles,
        setAll,
        updateItem,
        removeItem,
        loading,
        setLoading,
        error,
        setError
    } = useCrudList<Role>();


    const [role, setRole] = useState<Role>(emptyRole);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    /** Fetch roles */
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                setLoading(true);
                const data = await RoleApi.getRoles();
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch roles. " + (err?.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        fetchRoles();
    }, []);

    /** Save callback */
    const onSaveComplete = (saved: Role) => {
        updateItem(saved);
        hideDialogs();
    };

    /** Delete function */
    const deleteRole = async (row: Role) => {
        const ok = await RoleApi.deleteRole(row);
        if (ok) removeItem(row);
    };

    /** Hide dialogs */
    const hideDialogs = () => {
       // setRole({});
        setShowSaveDialog(false);
    };

    /** Columns */
    const columns = [
        { header: "Name", field: "name" },
        { header: "Permissions", body: (r: Role) => r.permissions?.length ?? 0 }
    ];

    return (
        <>
            <CrudManager
                headerTitle="Manage Roles"
                itemName="Role"
                items={roles}
                dataKey="_id"
                columns={columns}
                loading={loading}
                error={error}
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
                onCreate={() => {
                    setRole({ ...emptyRole });
                    setShowSaveDialog(true);
                }}

                onEdit={(row) => {
                    setRole({ ...row });
                    setShowSaveDialog(true);
                }}

                onDelete={(row) =>
                    confirm.ask({
                        item: row.name,
                        onConfirmAsync: () => deleteRole(row)
                    })
                }

                enableSearch
            />

            {/* Save Role Dialog */}
            {(role) && (
                <SaveDialog
                    visible={showSaveDialog}
                    role={role}
                    onComplete={onSaveComplete}
                    onHide={hideDialogs}
                />
            )}
        </>
    );
};

export default RoleManager;

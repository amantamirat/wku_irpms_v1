'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { Toast } from 'primereact/toast';
import { RoleApi } from '@/app/(main)/roles/api/role.api';
import { Role } from '@/app/(main)/roles/models/role.model';
import { UserApi } from '../../api/user.api';
import { User } from '../../models/user.model';
import { useAuth } from '@/contexts/auth-context';
import { PERMISSIONS } from '@/types/permissions';

interface EntitySaveDialogProps<T> {
    visible: boolean;
    item: T;
    onHide: () => void;
    onComplete?: (savedItem: T) => void;
}

const RoleDialog = ({ visible, item, onHide, onComplete }: EntitySaveDialogProps<User>) => {
    const { hasPermission } = useAuth();
    const toast = useRef<Toast>(null);
    // State
    const [localUser, setLocalUser] = useState<User>({ ...item });
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);

    const canReadRoles = hasPermission([PERMISSIONS.ROLE.READ]);

    // Fetch roles on mount if permitted
    useEffect(() => {
        if (!canReadRoles && visible) {
            return;
        }
        const fetchRoles = async () => {
            try {
                const rolesData = await RoleApi.getAll();
                setRoles(rolesData);
            } catch (err) {
                console.error('Failed to fetch roles:', err);
            }
        };
        fetchRoles();
    }, [canReadRoles, visible]);

    // Sync local state when user prop or visibility changes
    useEffect(() => {
        setLocalUser({ ...item });
    }, [item]);


    const handleSaveRoles = async () => {
        if (!localUser._id) return;
        try {
            setLoading(true);
            const currentRoles = localUser.roles || [];

            // Extract only role IDs if they are objects, or send as is if IDs
            const roleIds = currentRoles.map((r: any) =>
                (r && typeof r === 'object') ? r._id : r
            );

            const savedUser = await UserApi.updateRoles(localUser._id, roleIds);
            setTimeout(() => toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'User roles updated successfully',
                life: 2000,
            }), 2000);


            if (onComplete) {
                // Ensure workspace is preserved for the UI return if needed
                onComplete({ ...savedUser, workspace: localUser.workspace });
            }
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Update Failed',
                detail: err.message || 'An error occurred while updating roles',
                life: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} disabled={loading} />
            <Button label="Update Roles" icon="pi pi-shield" onClick={handleSaveRoles} loading={loading} />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '450px' }}
                header="Manage User Roles"
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                <div className="field mb-4">
                    <label htmlFor="name" className="font-bold">User</label>
                    <InputText id="name" value={localUser.name} disabled className="opacity-80" />
                </div>

                <div className="field">
                    <label htmlFor="roles" className="font-bold">Assigned Roles</label>
                    <MultiSelect
                        id="roles"
                        //dataKey="_id"
                        optionLabel="name"
                        optionValue="_id"
                        value={localUser.roles}
                        options={roles}
                        onChange={(e) => setLocalUser({ ...localUser, roles: e.value })}
                        placeholder="select roles"
                        display="chip"
                    />
                    {!canReadRoles && (
                        <small className="p-error">You do not have permission to modify roles.</small>
                    )}
                </div>
            </Dialog>
        </>
    );
};

export default RoleDialog;
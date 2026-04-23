'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { Toast } from 'primereact/toast';
import { Skeleton } from 'primereact/skeleton';
import { RoleApi } from '@/app/(main)/roles/api/role.api';
import { Role } from '@/app/(main)/roles/models/role.model';
import { UserApi } from '../../api/user.api';
import { User } from '../../models/user.model';
import { useAuth } from '@/contexts/auth-context';
import { PERMISSIONS } from '@/types/permissions';

interface EntitySaveDialogProps {
    visible: boolean;
    item: User;
    onHide: () => void;
    onComplete?: (savedItem: User) => void;
}

const RoleDialog = ({ visible, item, onHide, onComplete }: EntitySaveDialogProps) => {
    const { hasPermission } = useAuth();
    const toast = useRef<Toast>(null);
    
    // State
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingRoles, setFetchingRoles] = useState(false);

    const canReadRoles = hasPermission([PERMISSIONS.ROLE.READ]);

    // 1. Initial Sync: Extract IDs from the User object
    useEffect(() => {
        if (visible && item.roles) {
            // Normalize roles to an array of IDs
            const ids = item.roles.map((r: any) => (typeof r === 'object' ? r._id : r));
            setSelectedRoleIds(ids);
        }
    }, [item, visible]);

    // 2. Fetch available roles
    useEffect(() => {
        if (visible && canReadRoles && roles.length === 0) {
            const fetchRoles = async () => {
                setFetchingRoles(true);
                try {
                    const rolesData = await RoleApi.getAll();
                    setRoles(rolesData);
                } catch (err) {
                    toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not load roles' });
                } finally {
                    setFetchingRoles(false);
                }
            };
            fetchRoles();
        }
    }, [visible, canReadRoles]);

    const handleSaveRoles = async () => {
        if (!item._id) return;
        setLoading(true);
        try {
            const savedUser = await UserApi.updateRoles(item._id, selectedRoleIds);
            
            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'User roles updated successfully',
                life: 2000,
            });

            if (onComplete) {
                // Return the updated user but ensure we keep the context (like workspace)
                onComplete({ ...savedUser, workspace: item.workspace });
            }
            onHide();
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Update Failed',
                detail: err.message || 'An error occurred',
                life: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} disabled={loading} />
            <Button 
                label="Save Changes" 
                icon="pi pi-shield" 
                onClick={handleSaveRoles} 
                loading={loading} 
                disabled={!canReadRoles}
            />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '450px' }}
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-lock text-primary"></i>
                        <span>Security Roles</span>
                    </div>
                }
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                <div className="field mb-4">
                    <label className="font-bold text-sm block mb-2">User</label>
                    <div className="p-inputgroup">
                        <span className="p-inputgroup-addon"><i className="pi pi-user"></i></span>
                        <InputText value={item.name} disabled className="opacity-80" />
                    </div>
                </div>

                <div className="field">
                    <label htmlFor="roles" className="font-bold text-sm block mb-2">Assigned Roles</label>
                    {fetchingRoles ? (
                        <Skeleton width="100%" height="3rem" />
                    ) : (
                        <MultiSelect
                            id="roles"
                            value={selectedRoleIds}
                            options={roles}
                            onChange={(e) => setSelectedRoleIds(e.value)}
                            optionLabel="name"
                            optionValue="_id" // This matches your dataKey and state
                            placeholder="Select security roles"
                            display="chip"
                            filter // Added filtering for better UI
                            disabled={!canReadRoles}
                            className={!canReadRoles ? 'p-invalid' : ''}
                        />
                    )}
                    {!canReadRoles && (
                        <small className="p-error block mt-1">
                            <i className="pi pi-exclamation-triangle mr-1 text-xs"></i>
                            Insufficient permissions to modify roles.
                        </small>
                    )}
                </div>
            </Dialog>
        </>
    );
};

export default RoleDialog;
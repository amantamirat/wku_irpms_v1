'use client';

import { useEffect, useState } from 'react';

import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { Skeleton } from 'primereact/skeleton';
import { Message } from 'primereact/message';

import { Role } from '@/app/(main)/roles/models/role.model';
import { User } from '../../models/user.model';

interface RoleDialogProps {
    visible: boolean;
    item: User | null;
    roles: Role[];
    onHide: () => void;
    onSave: (roleIds: string[]) => void | Promise<void>;
    saving: boolean;
    loading: boolean;
    canReadRoles: boolean;
    errorMessage: string | null;
}

const RoleDialog = ({
    visible,
    item,
    roles,
    onHide,
    onSave,
    saving,
    loading,
    canReadRoles,
    errorMessage
}: RoleDialogProps) => {

    if (!item) return null;

    const [selectedRoleIds, setSelectedRoleIds] =
        useState<string[]>([]);

    // Load the user's assigned roles whenever the dialog opens.
    useEffect(() => {
        if (visible) {
            const ids = (item.roles ?? []).map(
                (role: any) =>
                    typeof role === 'object'
                        ? String(role._id)
                        : String(role)
            );

            setSelectedRoleIds(ids);
        }
    }, [visible, item]);

    const handleSave = async () => {
        await onSave(selectedRoleIds);
    };

    return (
        <Dialog
            visible={visible}
            style={{ width: '450px', maxWidth: '95vw' }}
            header={
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-lock text-primary" />
                    <span>Security Roles</span>
                </div>
            }
            modal
            className="p-fluid"
            onHide={() => {
                if (!saving) onHide();
            }}
            closable={!saving}
            closeOnEscape={!saving}
            footer={
                <div className="flex justify-content-end gap-2">
                    <Button
                        label="Cancel"
                        icon="pi pi-times"
                        text
                        onClick={onHide}
                        disabled={saving}
                    />

                    <Button
                        label="Save Changes"
                        icon="pi pi-shield"
                        onClick={handleSave}
                        loading={saving}
                        disabled={
                            !canReadRoles ||
                            loading ||
                            saving
                        }
                    />
                </div>
            }
        >
            <div className="flex flex-column gap-4 pt-2">

                <span className="text-sm text-600">
                    Assign security roles to control the user's
                    access to system resources and operations.
                </span>

                {errorMessage && (
                    <Message
                        severity="error"
                        text={errorMessage}
                        className="w-full"
                    />
                )}

                {/* User */}
                <div className="flex flex-column gap-2">
                    <label
                        htmlFor="roleUser"
                        className="text-sm font-semibold text-900"
                    >
                        User
                    </label>

                    <div className="p-inputgroup">
                        <span className="p-inputgroup-addon">
                            <i className="pi pi-user" />
                        </span>

                        <InputText
                            id="roleUser"
                            value={item.name}
                            disabled
                            className="opacity-80"
                        />
                    </div>
                </div>

                {/* Assigned roles */}
                <div className="flex flex-column gap-2">
                    <label
                        htmlFor="roles"
                        className="text-sm font-semibold text-900"
                    >
                        Assigned Roles
                    </label>

                    {loading ? (
                        <Skeleton
                            width="100%"
                            height="3rem"
                        />
                    ) : (
                        <MultiSelect
                            id="roles"
                            value={selectedRoleIds}
                            options={roles}
                            onChange={e =>
                                setSelectedRoleIds(e.value)
                            }
                            optionLabel="name"
                            optionValue="_id"
                            placeholder="Select security roles"
                            display="chip"
                            filter
                            className="w-full"
                            disabled={
                                !canReadRoles ||
                                saving
                            }
                            emptyMessage="No roles found."
                        />
                    )}

                    {!canReadRoles && (
                        <small className="text-red-500">
                            <i className="pi pi-exclamation-triangle mr-1" />
                            Insufficient permissions to modify roles.
                        </small>
                    )}

                    <small className="text-500">
                        Select one or more roles. Remove a selected
                        chip to unassign that role.
                    </small>
                </div>
            </div>
        </Dialog>
    );
};

export default RoleDialog;
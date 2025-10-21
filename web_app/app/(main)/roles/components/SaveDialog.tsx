'use client';

import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { Role, validateRole } from '../models/role.model';
import { RoleApi } from '../api/role.api';
import { Toast } from 'primereact/toast';
import { Permission } from '../permission/model/permission.model';
import { PermissionApi } from '../permission/api/permission.api';

interface SaveDialogProps {
    visible: boolean;
    role: Role;
    onComplete: (role: Role) => void;
    onHide: () => void;
}

const SaveDialog = (props: SaveDialogProps) => {
    const { visible, role, onComplete, onHide } = props;
    const toast = useRef<Toast>(null);
    const [localRole, setLocalRole] = useState<Role>({ ...role });
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                const data = await PermissionApi.getPermissions();
                setPermissions(data);
            } catch (err) {
                console.error("Failed to fetch permissions:", err);
            }
        };
        fetchPermissions();
    }, []);

    useEffect(() => {
        setLocalRole({ ...role });
    }, [role]);

    const saveRole = async () => {
        try {
            setSubmitted(true);
            const validation = validateRole(localRole);
            if (!validation.valid) {
                throw new Error(validation.message);
            }
            let saved: Role;
            if (localRole._id) {
                saved = await RoleApi.updateRole(localRole);
            } else {
                saved = await RoleApi.createRole(localRole);
            }
            saved = {
                ...saved,
                permissions: localRole.permissions
            };
            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Role saved successfully',
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 2000);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save role',
                detail: '' + err,
                life: 2000,
            });
        }
    };



    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" text onClick={saveRole} />
        </>
    );

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setErrorMessage(undefined);
        setLocalRole({ ...role });
    };

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '500px' }}
                header={localRole._id ? 'Edit Role' : 'New Role'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >

                <div className="field">
                    <label htmlFor="name">Role Name</label>
                    <InputText
                        id="name"
                        value={localRole.role_name}
                        onChange={(e) => setLocalRole({ ...localRole, role_name: e.target.value })}
                        required
                        autoFocus
                        className={classNames({ 'p-invalid': submitted && !localRole.role_name })}
                    />
                    {submitted && !localRole.role_name && (
                        <small className="p-invalid">Name is required.</small>
                    )}
                </div>
                {errorMessage && (
                    <small className="p-error">{errorMessage}</small>
                )}
            </Dialog>
        </>
    );
}

export default SaveDialog;

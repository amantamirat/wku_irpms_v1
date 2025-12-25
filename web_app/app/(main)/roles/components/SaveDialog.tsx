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
import { MultiSelect } from 'primereact/multiselect';
import { useAuth } from '@/contexts/auth-context';
import { PERMISSIONS } from '@/types/permissions';
import { Checkbox } from 'primereact/checkbox';
import { TreeNode } from 'primereact/treenode';
import { TreeSelect } from 'primereact/treeselect';
import { Card } from 'primereact/card';

interface SaveDialogProps {
    visible: boolean;
    role: Role;
    onComplete: (role: Role) => void;
    onHide: () => void;
}


const buildPermissionTree = (permissions: Permission[]): TreeNode[] => {
    const map = new Map<string, TreeNode>();

    permissions.forEach((perm) => {
        if (!map.has(perm.category)) {
            map.set(perm.category, {
                key: perm.category,
                label: perm.category,
                selectable: false,
                children: [],
            });
        }

        map.get(perm.category)!.children!.push({
            key: perm._id!,
            label: perm.name,
            data: perm,
        });
    });

    return Array.from(map.values());
};


const SaveDialog = (props: SaveDialogProps) => {
    const { visible, role, onComplete, onHide } = props;

    const { hasPermission } = useAuth();
    const readPermission = hasPermission([PERMISSIONS.PERMISSION.READ]);

    const toast = useRef<Toast>(null);
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    const [localRole, setLocalRole] = useState<Role>({ ...role });
    //const [permissions, setPermissions] = useState<Permission[]>([]);
    const [permissionTree, setPermissionTree] = useState<TreeNode[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<Record<string, any>>({});


    useEffect(() => {
        if (!readPermission) return;
        const fetchPermissions = async () => {
            try {
                const data = await PermissionApi.getPermissions();
                //setPermissions(data);
                setPermissionTree(buildPermissionTree(data));
            } catch (err) {
                console.error("Failed to fetch permissions:", err);
            }
        };
        fetchPermissions();
    }, []);

    useEffect(() => {
        setLocalRole({ ...role });
    }, [role]);

    useEffect(() => {
        if (!localRole.permissions) return;

        const keys = localRole.permissions.reduce(
            (acc: Record<string, any>, id: string) => {
                acc[id] = { checked: true };
                return acc;
            },
            {}
        );

        setSelectedKeys(keys);
    }, [localRole.permissions]);


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
        //setLocalRole({ ...role });
    };

    const onPermissionChange = (e: any) => {
        setSelectedKeys(e.value);

        const selectedIds = Object.keys(e.value || {}).filter(
            (key) => e.value[key]?.checked
        );

        setLocalRole({
            ...localRole,
            permissions: selectedIds,
        });
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
                {localRole._id &&
                    <>
                        <div className="flex justify-content-center align-items-center py-6">
                            <Card title="Warning!">
                                <div className="text-center">
                                    <i className="pi pi-exclamation-triangle text-4xl text-500 mb-3" />
                                </div>
                                <p className="m-0">
                                    By modifying role's permissions, you might break the system permissions functionality.
                                </p>
                            </Card>
                        </div>
                    </>
                }

                <div className="field">
                    <label htmlFor="name">Role Name</label>
                    <InputText
                        id="name"
                        value={localRole.name}
                        onChange={(e) => setLocalRole({ ...localRole, name: e.target.value })}
                        required
                        autoFocus
                        className={classNames({ 'p-invalid': submitted && !localRole.name })}
                    />
                    {submitted && !localRole.name && (
                        <small className="p-invalid">Name is required.</small>
                    )}
                </div>

                {readPermission && <div className="field">
                    <label htmlFor="permissions">Permissions</label>
                    <TreeSelect
                        id="permissions"
                        value={selectedKeys}
                        options={permissionTree}
                        onChange={onPermissionChange}
                        selectionMode="checkbox"
                        display="chip"
                        placeholder="Select Permissions"
                        className={classNames({
                            'p-invalid': submitted && !localRole.permissions.length,
                        })}
                    />
                </div>}
                {/* Default Role */}
                <div className="field-checkbox">
                    <Checkbox
                        inputId="isDefault"
                        checked={!!localRole.isDefault}
                        onChange={(e) =>
                            setLocalRole({ ...localRole, isDefault: e.checked ?? false })
                        }
                    />
                    <label htmlFor="isDefault" className="ml-2">
                        Default Role
                    </label>
                </div>

                {errorMessage && (
                    <small className="p-error">{errorMessage}</small>
                )}
            </Dialog>
        </>
    );
}

export default SaveDialog;

'use client';
import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { useAuth } from '@/contexts/auth-context';
import { PERMISSIONS } from '@/types/permissions';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { TreeNode } from 'primereact/treenode';
import { TreeSelect } from 'primereact/treeselect';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState, useMemo } from 'react';
import { RoleApi } from '../api/role.api';
import { Role, validateRole } from '../models/role.model';
import { PermissionApi } from '../permissions/api/permission.api';
import { Permission } from '../permissions/models/permission.model';

const SaveRole = (props: EntitySaveDialogProps<Role>) => {
    const { visible, item, onComplete, onHide } = props;
    const { hasPermission } = useAuth();
    const canReadPermissions = hasPermission([PERMISSIONS.PERMISSION.READ]);

    const toast = useRef<Toast>(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [permissionTree, setPermissionTree] = useState<TreeNode[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<Record<string, any>>({});
    const [localRole, setLocalRole] = useState<Role>({ ...item });

    const isEdit = !!localRole._id;

    // 1. Sync local state
    useEffect(() => {
        if (visible) {
            setLocalRole({ ...item });
            setSubmitted(false);
        }
    }, [item, visible]);

    // 2. Load Permissions and Build Tree
    useEffect(() => {
        if (visible && canReadPermissions) {
            PermissionApi.getAll().then(data => {
                const map = new Map<string, TreeNode>();
                data.forEach((perm) => {
                    if (!map.has(perm.category)) {
                        map.set(perm.category, {
                            key: perm.category,
                            label: perm.category,
                            selectable: false,
                            icon: 'pi pi-folder',
                            children: [],
                        });
                    }
                    map.get(perm.category)!.children!.push({
                        key: perm._id!,
                        label: perm.name,
                        icon: 'pi pi-shield',
                        data: perm
                    });
                });
                setPermissionTree(Array.from(map.values()));
            });
        }
    }, [visible, canReadPermissions]);

    // 3. Map Role Permissions to TreeSelect Keys
    useEffect(() => {
        if (localRole.permissions) {
            const keys = localRole.permissions.reduce((acc: any, id: string) => {
                acc[id] = { checked: true, partialChecked: false };
                return acc;
            }, {});
            setSelectedKeys(keys);
        }
    }, [localRole.permissions]);

    const onPermissionChange = (e: any) => {
        setSelectedKeys(e.value);
        // Only collect IDs (leaves), ignore category keys
        const selectedIds = Object.keys(e.value || {}).filter(
            (key) => e.value[key]?.checked && /^[a-fA-F0-9]{24}$/.test(key)
        );
        setLocalRole(prev => ({ ...prev, permissions: selectedIds }));
    };

    const handleSave = async () => {
        setSubmitted(true);
        const validation = validateRole(localRole);
        if (!validation.valid) return;

        setLoading(true);
        try {
            const saved = isEdit 
                ? await RoleApi.update(localRole) 
                : await RoleApi.create(localRole);
            
            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Role configuration saved' });
            onComplete?.({ ...saved, permissions: localRole.permissions });
            onHide();
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Save Failed', detail: err.message });
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} disabled={loading} />
            <Button label="Save Role" icon="pi pi-save" onClick={handleSave} loading={loading} />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                header={
                    <div className="flex align-items-center gap-2">
                        <i className={`pi ${isEdit ? 'pi-pencil' : 'pi-plus-circle'} text-primary`}></i>
                        <span>{isEdit ? 'Modify Role' : 'Create System Role'}</span>
                    </div>
                }
                style={{ width: '550px' }}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                {isEdit && (
                    <Message 
                        severity="warn" 
                        className="w-full justify-content-start mb-4" 
                        content={(
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-exclamation-triangle"></i>
                                <span className="text-sm font-medium">Changes to permissions may impact existing users immediately.</span>
                            </div>
                        )}
                    />
                )}

                <div className="field mb-4">
                    <label htmlFor="name" className="font-bold text-sm block mb-2">Display Name</label>
                    <InputText
                        id="name"
                        value={localRole.name || ''}
                        placeholder="e.g. Finance Manager"
                        onChange={(e) => setLocalRole({ ...localRole, name: e.target.value })}
                        className={classNames({ 'p-invalid': submitted && !localRole.name })}
                    />
                    {submitted && !localRole.name && <small className="p-error">A unique role name is required.</small>}
                </div>

                <div className="field mb-4">
                    <label htmlFor="permissions" className="font-bold text-sm block mb-2">Security Scope</label>
                    <TreeSelect
                        id="permissions"
                        value={selectedKeys}
                        options={permissionTree}
                        onChange={onPermissionChange}
                        selectionMode="checkbox"
                        display="chip"
                        filter
                        placeholder={canReadPermissions ? "Search and select permissions" : "Access Denied"}
                        disabled={!canReadPermissions}
                        className={classNames({ 'p-invalid': submitted && !localRole.permissions?.length })}
                    />
                    {submitted && !localRole.permissions?.length && <small className="p-error">Select at least one permission.</small>}
                </div>

                <div className="flex align-items-center p-3 surface-ground border-round">
                    <Checkbox
                        inputId="isDefault"
                        checked={!!localRole.isDefault}
                        onChange={(e) => setLocalRole({ ...localRole, isDefault: e.checked ?? false })}
                    />
                    <label htmlFor="isDefault" className="ml-2 cursor-pointer flex flex-column">
                        <span className="font-bold text-sm">Set as Default Role</span>
                        <span className="text-xs text-500">Automatically assign this role to new system users.</span>
                    </label>
                </div>
            </Dialog>
        </>
    );
};

export default SaveRole;
'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { TreeNode } from 'primereact/treenode';
import { TreeSelect, TreeSelectChangeEvent } from 'primereact/treeselect';
import { classNames } from 'primereact/utils';
import { ItemFormRenderProps } from '@/components/ItemManager';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/ToastContext';
import { PERMISSIONS } from '@/types/permissions';
import { PermissionApi } from '../../permissions/api/permission.api';
import { Permission } from '../../permissions/models/permission.model';
import { Role, validateRole } from '../models/role.model';

// Leaf keys are permission ids; category keys are plain names
const OBJECT_ID = /^[a-fA-F0-9]{24}$/;

const buildPermissionTree = (data: Permission[]): TreeNode[] => {
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
            data: perm,
        });
    });

    return Array.from(map.values());
};

const RoleForm = ({ mode, item, saving, formId, onSubmit }: ItemFormRenderProps<Role>) => {
    const { hasPermission } = useAuth();
    const toast = useToast();
    const canReadPermissions = hasPermission([
        PERMISSIONS.PERMISSION.READ,
        PERMISSIONS.PERMISSION.LOOKUP,
    ]);

    // The form is only mounted while the dialog is open, so state starts fresh each time
    const [initial] = useState<Role>(() => item ?? { name: "" });
    const [name, setName] = useState(initial.name ?? '');
    const [permissions, setPermissions] = useState<string[]>(
        () => (initial.permissions as string[] | undefined) ?? []
    );
    const [isDefault, setIsDefault] = useState(!!initial.isDefault);
    const [submitted, setSubmitted] = useState(false);

    const [permissionTree, setPermissionTree] = useState<TreeNode[]>([]);
    const [loadingTree, setLoadingTree] = useState(false);

    /* --------------------------- Load permissions --------------------------- */

    useEffect(() => {
        if (!canReadPermissions || !PermissionApi.lookup) return;

        let cancelled = false;
        setLoadingTree(true);

        PermissionApi.lookup()
            .then((data) => {
                if (!cancelled) setPermissionTree(buildPermissionTree(data));
            })
            .catch((error) => {
                if (!cancelled) toast.error(error, 'Failed to load permissions');
            })
            .finally(() => {
                if (!cancelled) setLoadingTree(false);
            });

        return () => {
            cancelled = true;
        };
    }, [canReadPermissions, toast]);

    /* ---------------------------- Tree selection ---------------------------- */

    const selectedKeys = useMemo(
        () =>
            Object.fromEntries(
                permissions.map((id) => [id, { checked: true, partialChecked: false }])
            ) as Record<string, any>,
        [permissions]
    );

    const onPermissionChange = (e: TreeSelectChangeEvent) => {
        const value = (e.value ?? {}) as Record<string, any>;
        // Only keep leaf ids, ignore category keys
        setPermissions(
            Object.keys(value).filter((key) => value[key]?.checked && OBJECT_ID.test(key))
        );
    };

    /* -------------------------------- Submit -------------------------------- */

    const nameMissing = !name.trim();
    const permissionsMissing = permissions.length === 0;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        if (saving) return;

        const draft = { ...initial, name: name.trim(), permissions, isDefault } as Role;
        if (!validateRole(draft).valid) return;

        // ItemManager adds the id when editing and handles API errors
        await onSubmit({ name: draft.name, permissions, isDefault } as Partial<Role>);
    };

    /* -------------------------------- Render -------------------------------- */

    return (
        <form id={formId} onSubmit={handleSubmit} className="p-fluid" noValidate>
            {mode === 'edit' && (
                <Message
                    severity="warn"
                    className="w-full justify-content-start mb-4"
                    content={
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-exclamation-triangle"></i>
                            <span className="text-sm font-medium">
                                Changes to permissions may impact existing users immediately.
                            </span>
                        </div>
                    }
                />
            )}

            <div className="field mb-4">
                <label htmlFor="name" className="font-bold text-sm block mb-2">
                    Display Name
                </label>
                <InputText
                    id="name"
                    value={name}
                    placeholder="e.g. Finance Manager"
                    disabled={saving}
                    onChange={(e) => setName(e.target.value)}
                    className={classNames({ 'p-invalid': submitted && nameMissing })}
                />
                {submitted && nameMissing && (
                    <small className="p-error">A unique role name is required.</small>
                )}
            </div>

            <div className="field mb-4">
                <label htmlFor="permissions" className="font-bold text-sm block mb-2">
                    Security Scope
                </label>
                <TreeSelect
                    id="permissions"
                    value={selectedKeys}
                    options={permissionTree}
                    onChange={onPermissionChange}
                    selectionMode="checkbox"
                    display="chip"
                    filter
                    placeholder={
                        !canReadPermissions
                            ? 'Access Denied'
                            : loadingTree
                                ? 'Loading permissions...'
                                : 'Search and select permissions'
                    }
                    disabled={!canReadPermissions || saving}
                    className={classNames({ 'p-invalid': submitted && permissionsMissing })}
                />
                {submitted && permissionsMissing && (
                    <small className="p-error">Select at least one permission.</small>
                )}
            </div>

            <div className="flex align-items-center p-3 surface-ground border-round">
                <Checkbox
                    inputId="isDefault"
                    checked={isDefault}
                    disabled={saving}
                    onChange={(e) => setIsDefault(e.checked ?? false)}
                />
                <label htmlFor="isDefault" className="ml-2 cursor-pointer flex flex-column">
                    <span className="font-bold text-sm">Set as Default Role</span>
                    <span className="text-xs text-500">
                        Automatically assign this role to new system users.
                    </span>
                </label>
            </div>
        </form>
    );
};

export default RoleForm;

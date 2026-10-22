'use client';

import { ColumnProps } from 'primereact/column';
import { useCallback, useMemo, useRef } from 'react';

import {
    ItemManager,
    ItemManagerHandle
} from '@/components/ItemManager';

import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/ToastContext';

import {
    FilterUsersOptions,
    User,
    createEmptyUser
} from '../models/user.model';

import { UserApi } from '../api/user.api';

import MyBadge from '@/templates/MyBadge';
import { Badge } from 'primereact/badge';
import UserDetail from './UserDetail';

import RoleDialog from './dialogs/RoleDialog';
import ScopeDialog from './dialogs/ScopeDialog';

import UserForm from './UserForm';
import { useUserRoleUpdater } from '../hooks/useUserRoleUpdater';
import { useUserScopeUpdater } from '../hooks/useUserScopeUpdater';
import { RowActionButton } from '@/components/data-table/ItemDataTable';
import { MENU_ICONS } from '@/utils/menu-icons';

const columns: ColumnProps[] = [
    {
        header: 'Full Name',
        field: 'name',
        sortable: true
    },
    {
        header: 'Workspace',
        field: 'workspace.name'
    },
    {
        header: 'Birth Date',
        field: 'birthDate',
        body: (user: User) =>
            user.birthDate
                ? new Date(user.birthDate).toLocaleDateString()
                : '-'
    },
    {
        header: 'Gender',
        field: 'gender',
        body: (user: User) => (
            <MyBadge
                type="gender"
                value={user.gender ?? 'N/A'}
            />
        )
    },
    {
        header: 'Specs Count',
        field: 'specializations.length',
        body: (user: User) => (
            <div className="flex align-items-center">
                <Badge
                    value={user.specializations?.length || 0}
                    severity={
                        user.specializations?.length
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
        header: 'Roles',
        field: 'roles',
        body: (user: User) => (
            user.roles?.length ? (
                <Badge value={`${user.roles.length} Roles`} />
            ) : (
                <span className="text-gray-400 text-xs">
                    No Roles
                </span>
            )
        )
    },
    {
        header: 'Scope',
        field: 'scope',
        body: (user: User) => {
            if (user.scope === '*') {
                return (
                    <MyBadge
                        type="status"
                        value="Full Access"
                    />
                );
            }

            if (user.scope) {
                return (
                    <MyBadge
                        type="status"
                        value={user.unitType ?? 'Scoped'}
                    />
                );
            }

            return (
                <span className="text-gray-400 text-xs">
                    No Scope
                </span>
            );
        }
    }
];

// Keep the permission ids the user picked: the API response may not echo them back
const mapSaved = (saved: User, submitted: Partial<User>): User => ({
    ...saved,
    workspace: submitted.workspace ?? saved.workspace
});

const ManageUsers = () => {
    const { hasPermission } = useAuth();
    const toast = useToast();

    const manager = useRef<ItemManagerHandle<User>>(null);

    const patch = useCallback(
        (id: string, changes: Partial<User>) => {
            manager.current?.patchItem(id, changes);
        },
        []
    );

    const replace = useCallback((user: User) => {
        manager.current?.updateItem(user);
    }, []);

    const roleUpdater = useUserRoleUpdater(patch, replace);
    const scopeUpdater = useUserScopeUpdater(replace);

    const extraRowActions = useMemo<RowActionButton<User>[]>(
        () => [
            {
                icon: 'pi pi-shield',
                severity: 'info',
                tooltip: 'Manage Roles',
                visible: () =>
                    hasPermission('user:role:update'),
                onClick: roleUpdater.open
            },
            {
                icon: 'pi pi-sitemap',
                severity: 'warning',
                tooltip: 'Manage Scope',
                visible: () =>
                    hasPermission('user:scope:update'),
                onClick: scopeUpdater.open
            }
        ],
        [hasPermission, roleUpdater.open, scopeUpdater.open]
    );

    const tableProps = useMemo(
        () => ({
            enableSearch: true,
            expandable: {
                template: (user: User) => (
                    <UserDetail user={user} />
                )
            }
        }),
        []
    );

    return (
        <>
            <ItemManager<User, FilterUsersOptions>
                managerRef={manager}
                api={UserApi}
                resource="user"
                itemName="User"
                headerTitle="Manage Users"
                dialogWidth="800px"
                itemIcon={MENU_ICONS.users}
                columns={columns}
                mapSaved={mapSaved}
                renderForm={props => (
                    <UserForm {...props} />
                )}
                extraRowActions={extraRowActions}
                tableProps={tableProps}
                onError={error => toast.error(error)}
                onSuccess={operation =>
                    toast.success(
                        operation === 'create'
                            ? 'User created successfully'
                            : 'User updated successfully'
                    )
                }
            />

            {roleUpdater.dialogProps.item && (
                <RoleDialog
                    {...roleUpdater.dialogProps}
                />
            )}

            {scopeUpdater.dialogProps.visible && (
                <ScopeDialog
                    {...scopeUpdater.dialogProps}
                />
            )}
        </>
    );
};

export default ManageUsers;
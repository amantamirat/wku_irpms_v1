'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
    RowActionButton,
    ToolBarActionButton,
} from '@/components/data-table/ItemDataTable';

interface UseCrudActionsProps<T> {
    resource: string;

    createLabel?: string;

    itemName?: string;
    /**
     * Disable all default CRUD actions.
     */
    hideDefaultActions?: boolean;

    /**
     * Disable only the Create action.
     */
    hideCreateAction?: boolean;

    /**
     * Disable only the Edit action.
     */
    hideEditAction?: boolean;

    /**
     * Disable only the Delete action.
     */
    hideDeleteAction?: boolean;

    /**
     * Optional row-level edit restriction.
     */
    disableEditRow?: (row: T) => boolean;

    /**
     * Optional row-level delete restriction.
     */
    disableDeleteRow?: (row: T) => boolean;

    /**
     * Create handler.
     */
    onCreate?: () => void | Promise<void>;

    /**
     * Edit handler.
     */
    onEdit?: (row: T) => void | Promise<void>;

    /**
     * Delete handler. Runs immediately on click (no confirmation),
     * so ask for confirmation inside the handler if you need it.
     */
    onDelete?: (row: T) => void | Promise<void>;
}

export interface CrudActions<T> {
    toolbarActions: ToolBarActionButton[];
    rowActions: RowActionButton<T>[];
}

export function useCrudActions<T extends Record<string, any>>({
    resource,
    createLabel,
    itemName = 'Item',

    hideDefaultActions = false,
    hideCreateAction = false,
    hideEditAction = false,
    hideDeleteAction = false,

    disableEditRow,
    disableDeleteRow,

    onCreate,
    onEdit,
    onDelete,
}: UseCrudActionsProps<T>): CrudActions<T> {
    const { hasPermission } = useAuth();

    return useMemo(() => {
        const toolbarActions: ToolBarActionButton[] = [];
        const rowActions: RowActionButton<T>[] = [];

        if (hideDefaultActions) {
            return {
                toolbarActions,
                rowActions,
            };
        }

        /*
         * -----------------------------------------
         * CREATE
         * -----------------------------------------
         */

        if (
            !hideCreateAction &&
            onCreate &&
            hasPermission([
                `${resource}:create`,
                `${resource}:create:own`,
            ])
        ) {
            const create = onCreate;

            toolbarActions.push({
                label: createLabel ?? `Add ${itemName}`,
                icon: 'pi pi-plus',
                severity: 'success',
                onClick: () => create(),
            });
        }

        /*
         * -----------------------------------------
         * EDIT
         * -----------------------------------------
         */

        if (
            !hideEditAction &&
            onEdit &&
            hasPermission([
                `${resource}:update`,
                `${resource}:update:own`,
            ])
        ) {
            const edit = onEdit;

            rowActions.push({
                icon: 'pi pi-pencil',
                severity: 'success',
                tooltip: `Edit ${itemName}`,
                text: true,
                disabled: disableEditRow,
                onClick: (row) => edit(row),
            });
        }

        /*
         * -----------------------------------------
         * DELETE
         * -----------------------------------------
         */

        if (
            !hideDeleteAction &&
            onDelete &&
            hasPermission([
                `${resource}:delete`,
                `${resource}:delete:own`,
            ])
        ) {
            const del = onDelete;

            rowActions.push({
                icon: 'pi pi-trash',
                severity: 'danger',
                tooltip: `Delete ${itemName}`,
                text: true,
                disabled: disableDeleteRow,
                // Returned so ItemDataTable can show its pending state while it runs
                onClick: (row) => del(row),
            });
        }

        return {
            toolbarActions,
            rowActions,
        };
    }, [
        resource,
        createLabel,
        itemName,

        hideDefaultActions,
        hideCreateAction,
        hideEditAction,
        hideDeleteAction,

        disableEditRow,
        disableDeleteRow,

        onCreate,
        onEdit,
        onDelete,

        hasPermission,
    ]);
}

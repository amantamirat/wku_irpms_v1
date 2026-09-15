'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useConfirmDialog } from '@/contexts/ConfirmDialogContext';
import {
    RowActionButton,
    ToolBarActionButton,
} from '@/components/data-table/ItemDataTable';

interface UseCrudActionsProps<T> {
    resource: string;

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
    onCreate?: () => void;

    /**
     * Edit handler.
     */
    onEdit?: (row: T) => void;

    /**
     * Delete handler.
     */
    onDelete?: (row: T) => Promise<void>;
}

export interface CrudActions<T> {
    toolbarActions: ToolBarActionButton[];
    rowActions: RowActionButton<T>[];
}

export function useCrudActions<T extends { _id?: string }>({
    resource,
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
    const confirm = useConfirmDialog();

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

        const canCreate =
            !hideCreateAction &&
            !!onCreate &&
            hasPermission([
                `${resource}:create`,
                `${resource}:create:own`,
            ]);

        if (canCreate) {
            toolbarActions.push({
                label: `Create ${itemName}`,
                icon: 'pi pi-plus',
                severity: 'success',
                onClick: onCreate,
            });
        }

        /*
         * -----------------------------------------
         * EDIT
         * -----------------------------------------
         */

        const canEdit =
            !hideEditAction &&
            !!onEdit &&
            hasPermission([
                `${resource}:update`,
                `${resource}:update:own`,
            ]);

        if (canEdit) {
            rowActions.push({
                icon: 'pi pi-pencil',
                severity: 'success',
                tooltip: `Edit ${itemName}`,
                text: true,
                disabled: disableEditRow,

                onClick: (row) => {
                    onEdit(row);
                },
            });
        }

        /*
         * -----------------------------------------
         * DELETE
         * -----------------------------------------
         */

        const canDelete =
            !hideDeleteAction &&
            !!onDelete &&
            hasPermission([
                `${resource}:delete`,
            ]);

        if (canDelete) {
            rowActions.push({
                icon: 'pi pi-trash',
                severity: 'danger',
                tooltip: `Delete ${itemName}`,
                text: true,
               // rounded: true,
                disabled: disableDeleteRow,

                onClick: (row) => {
                    confirm.ask({
                        item: itemName,
                        onConfirm: () => onDelete(row),
                    });
                },
            });
        }

        return {
            toolbarActions,
            rowActions,
        };
    }, [
        resource,
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
        confirm,
    ]);
}
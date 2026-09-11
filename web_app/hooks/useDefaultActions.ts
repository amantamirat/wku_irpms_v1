'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useConfirmDialog } from '@/contexts/ConfirmDialogContext';
import { RowActionButton } from '@/components/data-table/ItemDataTable';





interface UseDefaultActionsProps<T> {
    resource: string;

    itemName?: string;

    /**
     * Disable all default Edit/Delete actions.
     */
    hideDefaultActions?: boolean;

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
     * Edit handler.
     */
    onEdit: (row: T) => void;

    /**
     * Delete handler.
     */
    onDelete: (row: T) => Promise<void>;

    /**
     * Additional custom actions.
     */
    extraActions?: RowActionButton<T>[];
}

export function useDefaultRowActions<T extends { _id?: string }>({
    resource,
    itemName = 'Item',
    hideDefaultActions = false,
    hideEditAction = false,
    hideDeleteAction = false,
    disableEditRow,
    disableDeleteRow,
    onEdit,
    onDelete,
    extraActions = [],
}: UseDefaultActionsProps<T>): RowActionButton<T>[] {

    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    return useMemo(() => {

        /**
         * Start with custom actions.
         */
        const actions: RowActionButton<T>[] = [
            ...extraActions,
        ];

        /**
         * If default actions are disabled,
         * return only custom actions.
         */
        if (hideDefaultActions) {
            return actions;
        }
        /*
         * -----------------------------------------
         * EDIT
         * -----------------------------------------
         */
        const canEdit = hasPermission([
            `${resource}:update`,
            `${resource}:update:own`,
        ]);

        if (!hideEditAction && canEdit) {

            actions.push({
                icon: 'pi pi-pencil',
                severity: 'success',
                tooltip: `Edit ${itemName}`,
                text: true,
                rounded: true,
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

        const canDelete = hasPermission([
            `${resource}:delete`,
        ]);

        if (!hideDeleteAction && canDelete) {

            actions.push({
                icon: 'pi pi-trash',
                severity: 'danger',
                tooltip: `Delete ${itemName}`,

                disabled: disableDeleteRow,

                onClick: (row) => {
                    confirm.ask({
                        item: itemName,
                        onConfirm: () => onDelete(row),
                    });
                },
            });
        }


        return actions;

    }, [
        resource,
        itemName,
        hideDefaultActions,
        hideEditAction,
        hideDeleteAction,
        disableEditRow,
        disableDeleteRow,
        extraActions,
        hasPermission,
        confirm,
        onEdit,
        onDelete,
    ]);
}


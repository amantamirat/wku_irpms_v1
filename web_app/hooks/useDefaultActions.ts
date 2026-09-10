'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useConfirmDialog } from '@/contexts/ConfirmDialogContext';


export interface ActionButton<T> {
    /**
     * PrimeReact icon class.
     * Example: "pi pi-pencil"
     */
    icon: string;

    /**
     * Optional text displayed beside the icon.
     */
    label?: string;

    /**
     * PrimeReact button severity.
     */
    severity?:
    | "success"
    | "danger"
    | "warning"
    | "info"
    | "secondary"
    | "help";

    /**
     * PrimeReact button size.
     * Defaults to "small".
     */
    size?: "small" | "large";

    /**
     * Render the button as a text-style button.
     * Defaults to true.
     */
    text?: boolean;

    /**
     * Render the button as a rounded-style button.
     * Defaults to true.
     */
    rounded?: boolean;

    /**
     * Tooltip displayed when hovering over the button.
     */
    tooltip?: string;

    /**
     * Additional row-specific visibility condition.
     */
    visible?: (row: T) => boolean;

    /**
     * Disable the action for a specific row.
     */
    disabled?: (row: T) => boolean;

    /**
     * Action executed when the button is clicked.
     */
    onClick: (row: T) => void | Promise<void>;
}


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
    extraActions?: ActionButton<T>[];
}

export function useDefaultActions<T extends { _id?: string }>({
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
}: UseDefaultActionsProps<T>): ActionButton<T>[] {

    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    return useMemo(() => {

        /**
         * Start with custom actions.
         */
        const actions: ActionButton<T>[] = [
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
                        onConfirmAsync: () => onDelete(row),
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


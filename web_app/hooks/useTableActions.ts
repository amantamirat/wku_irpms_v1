'use client';

import { useMemo } from 'react';
import { ActionButton, useDefaultActions } from './useDefaultActions';
import { TransitionMap, useStateTransitionActions } from './useStateTransitionActions';
import { StateTransition } from '@/api/EntityApi';

interface UseTableActionsProps<T extends Record<string, any>> {
    resource: string;
    itemName?: string;

    // Default actions
    hideDefaultActions?: boolean;
    hideEditAction?: boolean;
    hideDeleteAction?: boolean;

    disableEditRow?: (row: T) => boolean;
    disableDeleteRow?: (row: T) => boolean;

    onEdit?: (row: T) => void;
    onDelete?: (row: T) => Promise<void>;

    // Workflow
    workflow?: {
        statusField: keyof T;
        transitions: TransitionMap;
        onTransition: (
            id: string,
            transition: StateTransition
        ) => Promise<void>;
    };

    // Custom actions
    extraActions?: ActionButton<T>[];
}

export function useTableActions<T extends Record<string, any>>({
    resource,
    itemName = 'Item',

    hideDefaultActions,
    hideEditAction,
    hideDeleteAction,

    disableEditRow,
    disableDeleteRow,

    onEdit,
    onDelete,

    workflow,

    extraActions = []
}: UseTableActionsProps<T>): ActionButton<T>[] {

    const defaultActions = useDefaultActions({
        resource,
        itemName,

        hideDefaultActions,
        hideEditAction,
        hideDeleteAction,

        disableEditRow,
        disableDeleteRow,

        onEdit: onEdit!,
        onDelete: onDelete!,

        extraActions
    });

    const transitionActions =  useStateTransitionActions({
        resource,
        statusField: workflow?.statusField,
        transitions: workflow?.transitions,
        onTransition: workflow?.onTransition
    });

    return useMemo(
        () => [
            ...extraActions,
            ...defaultActions,
            ...transitionActions
        ],
        [
            extraActions,
            defaultActions,
            transitionActions
        ]
    );
}
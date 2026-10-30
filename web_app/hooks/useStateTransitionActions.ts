import { useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { StateTransition } from "@/api/EntityApi";
import { RowActionButton } from "@/components/data-table/ItemDataTable";

export interface TransitionAction {
    next: string;
    action: string;
    icon: string;
    severity: "success" | "warning" | "danger" | "info";
    /** When true, the confirm dialog's reason box must be filled in. */
    requireReason?: boolean;
}

export type TransitionMap = Record<string, TransitionAction[]>;

const NO_ACTIONS: never[] = [];

interface UseStateTransitionActionsProps<T> {
    resource?: string;
    statusField?: keyof T;
    transitions?: TransitionMap;

    onTransition?: (
        id: string,
        transition: StateTransition,
        meta: TransitionAction
    ) => void | Promise<unknown>;

    getId?: (row: T) => string;

    /** Hide transition buttons based on the current row. */
    hideTransition?: (row: T, transition: TransitionAction) => boolean;
}


export function useStateTransitionActions<T extends Record<string, any>>({
    resource,
    statusField,
    transitions,
    onTransition,
    getId = (row) => row._id,
    hideTransition,
}: UseStateTransitionActionsProps<T>): RowActionButton<T>[] {
    const { hasPermission } = useAuth();

    return useMemo(() => {
        if (!resource || !statusField || !transitions || !onTransition) {
            return NO_ACTIONS;
        }

        const actions: RowActionButton<T>[] = [];

        for (const [current, transitionList] of Object.entries(transitions)) {
            for (const transition of transitionList) {
                const permission =
                    `${resource}:transition.${current}.${transition.next}`;

                if (!hasPermission(permission)) {
                    continue;
                }

                actions.push({
                    icon: transition.icon,
                    severity: transition.severity,
                    tooltip: transition.action,
                    text: false,

                    visible: (row: T) =>
                        row[statusField] === current &&
                        !(hideTransition?.(row, transition) ?? false),

                    onClick: async (row: T) => {
                        await onTransition(
                            getId(row),
                            { current, next: transition.next },
                            transition
                        );
                    },
                });
            }
        }

        return actions;
    }, [
        resource,
        statusField,
        transitions,
        onTransition,
        getId,
        hasPermission,
        hideTransition,
    ]);
}


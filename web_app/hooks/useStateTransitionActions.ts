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
    /** Required: used to build the permission key. */
    resource?: string;
    statusField?: keyof T;
    /** Keep this object stable (module-level const or useMemo) or the actions rebuild every render. */
    transitions?: TransitionMap;
    /**
     * Runs when a transition button is clicked. Add a confirmation here if you
     * want one; `meta.action` is the button label (e.g. "Approve").
     * Return the promise so the table can show a pending state.
     */
    onTransition?: (
        id: string,
        transition: StateTransition,
        meta: TransitionAction
    ) => void | Promise<unknown>;
    /** How to read a row's id. Defaults to `row._id`. */
    getId?: (row: T) => string;
}

export function useStateTransitionActions<T extends Record<string, any>>({
    resource,
    statusField,
    transitions,
    onTransition,
    getId = (row) => row._id,
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
                    visible: (row: T) => row[statusField] === current,
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
    ]);
}

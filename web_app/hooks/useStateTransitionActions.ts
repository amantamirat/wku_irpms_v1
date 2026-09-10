import { useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { ActionButton } from "./useDefaultActions";
import { StateTransition } from "@/api/EntityApi";


export interface TransitionAction {
    next: string;
    action: string;
    icon: string;
    severity: "success" | "warning" | "danger" | "info" | "secondary";
}

export type TransitionMap = Record<string, TransitionAction[]>;


interface UseStateTransitionActionsProps<T> {
    resource?: string;
    statusField?: keyof T;
    transitions?: TransitionMap;
    onTransition?: (
        id: string,
        transition: StateTransition
    ) => Promise<any>;
}

export function useStateTransitionActions<T extends Record<string, any>>({
    resource,
    statusField,
    transitions,
    onTransition
}: UseStateTransitionActionsProps<T>): ActionButton<T>[] {

    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    return useMemo(() => {

        if (!statusField || !transitions || !onTransition) {
            return [];
        }

        const actions: ActionButton<T>[] = [];

        const possibleTransitions = Object.entries(transitions);

        for (const [current, transitionList] of possibleTransitions) {
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

                    visible: (row: T) =>
                        row[statusField] === current,

                    onClick: (row: T) =>
                        confirm.ask({
                            operation: transition.action,
                            onConfirmAsync: () =>
                                onTransition(row._id, { current, next: transition.next })
                        })
                });
            }
        }

        return actions;

    }, [
        resource,
        statusField,
        transitions,
        onTransition,
        hasPermission,
        confirm
    ]);
}
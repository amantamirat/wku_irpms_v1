import { Button } from "primereact/button";
import { STATUS_BUTTON_CONFIG } from "./status-button.config";

interface StateTransitionButtonsProps<TStatus extends string> {
    id?: string;
    current: TStatus;
    transitions: Record<TStatus, TStatus[]>;
    statusOrder: TStatus[];
    permissionPrefix: string;
    hasPermission: (permissions: string[]) => boolean;
    onTransition: (next: TStatus) => Promise<void>;
}

export function StateTransitionButtons<TStatus extends string>({
    id,
    current,
    transitions,
    permissionPrefix,
    statusOrder,
    hasPermission,
    onTransition
}: StateTransitionButtonsProps<TStatus>) {

    if (!id) return null;

    const allowedTargets = transitions[current] || [];

    const buildPermission = (from: TStatus, to: TStatus) =>
        `${permissionPrefix}:transition.${from}.${to}`;

    const currentIndex = statusOrder.indexOf(current);

    return (
        <div className="flex gap-2">
            {allowedTargets
                .filter((target) =>
                    hasPermission([buildPermission(current, target)])
                )
                .map((target) => {
                    const targetIndex = statusOrder.indexOf(target);
                    const isForward = targetIndex > currentIndex;

                    const config = STATUS_BUTTON_CONFIG[target];

                    const icon = isForward ? config?.icon ?? "pi pi-check" : "pi pi-undo";
                    const severity = isForward ? config?.severity ?? "success" : "warning";
                    const action = isForward ? config?.action ?? `Change to ${target}` : `Back to ${target}`;

                    return (
                        <Button
                            key={String(target)}
                            tooltip={action}
                            icon={icon}
                            severity={severity}
                            size="small"
                            onClick={() => onTransition(target)}
                        />
                    );
                })}
        </div>
    );
}

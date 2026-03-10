import { Button } from "primereact/button";

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
                    return (
                        <Button
                            key={String(target)}
                            tooltip={`Change to ${target}`}
                            icon={isForward ? "pi pi-check" : "pi pi-undo"}
                            severity={isForward ? "success" : "warning"}
                            size="small"
                            onClick={() => onTransition(target)}
                        />
                    );
                })}
        </div>
    );
}

import { EntityApi } from "@/api/EntityApi";
import { useAuth } from "@/contexts/auth-context";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import { useState, useEffect, useRef } from "react";
import { ItemManager, RowAction } from "./ItemManager";
import { StateTransitionButtons } from "./StateTransitionButtons";
import { Button } from "primereact/button";
import ImportDialog from "./ImportDialog";

export interface EntitySaveDialogProps<T> {
    visible: boolean;
    item: T;
    onComplete: (item: T) => void;
    onHide: () => void;
}

// 1. Props interface for the generated EntityManager component
export interface EntityManagerProps<T> {
    items?: T[];
}

export function createEntityManager<
    T extends { _id?: string; id?: string },
    TQuery = undefined
>(config: {
    title?: string;
    itemName?: string;
    api?: EntityApi<T, TQuery>;
    columns: any[];
    createNew?: () => T;
    SaveDialog?: React.ComponentType<EntitySaveDialogProps<T>>;
    permissionPrefix: string;
    query?: () => TQuery;
    items?: T[];
    onItemsChange?: (items: T[]) => void;

    workflow?: {
        statusField: keyof T;
        transitions: Partial<Record<string, string[]>> | ((row: T) => Partial<Record<string, string[]>>);
        statusOrder: string[];
    };
    expandable?: {
        template: (
            row: T,
            actions: {
                updateItem: (item: T) => void;
            }
        ) => React.ReactNode;
        allow?: (row: T) => boolean;
    };

    importConfig?: {
        enable: boolean;
        importId?: string | undefined;
    };

    toolbarEnd?: React.ReactNode;
    extraActions?: RowAction<T>[];

    disableEditRow?: (row: T) => boolean;
    disableDeleteRow?: (row: T) => boolean;
    hideDefaultActions?: boolean;
    hideEditAction?: boolean;
    hideDeleteAction?: boolean;
    hideSearch?: boolean;
    onCreateComplete?: (item: T) => void;
    onEditComplete?: (item: T) => void;
    onDeleteComplete?: (item: T) => void;
    onTransitComplete?: (item: T) => void;
}) {
    // 2. Accept props inside the component function
    return function EntityManager(props: EntityManagerProps<T>) {
        const { hasPermission } = useAuth();
        const confirm = useConfirmDialog();

        const {
            items,
            setAll,
            updateItem,
            removeItem,
            loading,
            setLoading,
            error,
            setError
        } = useCrudList<T>();

        const [item, setItem] = useState<T | null>(null);
        const [showDialog, setShowDialog] = useState(false);
        const [showImportDialog, setShowImportDialog] = useState(false);
        const canCreate = config.createNew && hasPermission([`${config.permissionPrefix}:create`]);
        const canImport = config.importConfig?.enable &&
            hasPermission([`${config.permissionPrefix}:import`]);

        // Prioritize incoming prop items over config items
        const externalItems = props.items ?? config.items;

        const refresh = async () => {
            if (externalItems) {
                setAll(externalItems);
                return;
            }
            if (!config.api) return;
            
            const query = config.query ? config.query() : undefined;
            const data = await config.api.getAll(query);
            setAll(data);
        };

        // Fetch on initial mount
        useEffect(() => {
            const fetchData = async () => {
                try {
                    setLoading(true);
                    await refresh();
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }, []);

        // 3. Reactively update state when external props.items change (prevents unmounting!)
        useEffect(() => {
            if (externalItems) {
                setAll(externalItems);
            }
        }, [props.items]);

        const onItemsChangeRef = useRef(config.onItemsChange);

        useEffect(() => {
            onItemsChangeRef.current = config.onItemsChange;
        }, [config.onItemsChange]);

        useEffect(() => {
            onItemsChangeRef.current?.(items);
        }, [items]);

        const handleCreate = () => {
            if (config.createNew) {
                setItem(config.createNew());
                setShowDialog(true);
            }
        };

        const transitionState = async (
            row: T,
            dto: { current: string; next: string }
        ) => {
            const rowId = row._id ?? row.id;
            if (!rowId) return;

            if (!config.api || !config.api.transitionState) return;

            const updated = await config.api.transitionState(rowId, dto);
            if (updated) {
                updateItem({ ...row, [config.workflow!.statusField]: dto.next });
                config?.onTransitComplete?.(updated);
            }
        };

        const deleteItem = async (row: T) => {
            if (!config.api) return;
            const ok = await config.api.delete(row);
            if (ok) {
                removeItem(row);
                config.onDeleteComplete?.(row);
            }
        };

        const builtInActions: RowAction<T>[] = [
            ...(!config.hideEditAction && !config.hideDefaultActions ? [{
                icon: "pi pi-pencil",
                severity: "success" as const,
                permissions: [`${config.permissionPrefix}:update`],
                disabled: config.disableEditRow,
                onClick: (row: T) => {
                    setItem({ ...row });
                    config.onEditComplete?.(row);
                    setShowDialog(true);
                }
            }] : []),

            ...(!config.hideDeleteAction && !config.hideDefaultActions ? [{
                icon: "pi pi-trash",
                severity: "danger" as const,
                permissions: [`${config.permissionPrefix}:delete`],
                disabled: config.disableDeleteRow,
                onClick: (row: T) =>
                    confirm.ask({
                        item: config.itemName,
                        onConfirmAsync: () => deleteItem(row),
                    })
            }] : [])
        ];

        const actions: RowAction<T>[] = [
            ...(config.extraActions ?? []),
            ...builtInActions
        ];

        let columns = [...config.columns];

        if (config.workflow) {
            columns.push({
                header: "",
                body: (row: T) => {
                    const transitions =
                        typeof config.workflow!.transitions === "function"
                            ? config.workflow!.transitions(row)
                            : config.workflow!.transitions;
                    const current = row[config.workflow!.statusField] as string;

                    return (
                        <StateTransitionButtons
                            id={row._id ?? row.id}
                            current={current}
                            transitions={transitions}
                            statusOrder={config.workflow!.statusOrder}
                            permissionPrefix={config.permissionPrefix}
                            hasPermission={hasPermission}
                            onTransition={async (next, action) =>
                                confirm.ask({
                                    operation: action,
                                    onConfirmAsync: () =>
                                        transitionState(row, {
                                            current,
                                            next
                                        })
                                })
                            }
                        />
                    );
                }
            });
        }

        const hasToolbarContent = !!config.toolbarEnd || canImport;
        const toolbarEnd = hasToolbarContent ? (
            <>
                {config.toolbarEnd}
                {canImport && (
                    <Button
                        label="Import"
                        icon="pi pi-upload"
                        severity="secondary"
                        outlined
                        className="ml-2"
                        onClick={() => setShowImportDialog(true)}
                    />
                )}
            </>
        ) : undefined;

        return (
            <>
                <ItemManager
                    headerTitle={config.title}
                    itemName={config.itemName}
                    items={items}
                    columns={columns}
                    dataKey="_id"
                    loading={loading}
                    error={error}
                    enableSearch={!config.hideSearch}
                    hasPermission={hasPermission}
                    actions={actions}
                    onCreate={canCreate ? handleCreate : undefined}
                    expandable={config.expandable && {
                        ...config.expandable,
                        template: (row: T) =>
                            config.expandable!.template(row, {
                                updateItem
                            })
                    }}
                    toolbarEnd={toolbarEnd}
                />

                {item && showDialog && config.SaveDialog && (
                    <config.SaveDialog
                        visible={showDialog}
                        item={item}
                        onComplete={(saved: T) => {
                            updateItem(saved);
                            config.onCreateComplete?.(saved);
                            setShowDialog(false);
                        }}
                        onHide={() => setShowDialog(false)}
                    />
                )}

                {(showImportDialog && config.api) && (
                    <ImportDialog
                        api={config.api}
                        parentId={config.importConfig?.importId}
                        visible={showImportDialog}
                        onComplete={async () => {
                            await refresh();
                            setShowImportDialog(false);
                        }}
                        onHide={() => setShowImportDialog(false)}
                    />
                )}
            </>
        );
    };
}
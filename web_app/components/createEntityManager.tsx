import { EntityApi } from "@/api/EntityApi"
import { useAuth } from "@/contexts/auth-context"
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext"
import { useCrudList } from "@/hooks/useCrudList"
import { useState, useEffect } from "react"
import { ItemManager, RowAction } from "./ItemManager"
import { StateTransitionButtons } from "./StateTransitionButtons"
import { Button } from "primereact/button"
import ImportDialog from "./ImportDialog"

export interface EntitySaveDialogProps<T> {
    visible: boolean
    item: T
    onComplete: (item: T) => void
    onHide: () => void
}

export function createEntityManager<
    T extends { _id?: string },
    TQuery = undefined
>(config: {
    title: string
    itemName?: string
    api: EntityApi<T, TQuery>
    columns: any[]
    createNew?: () => T
    SaveDialog?: React.ComponentType<EntitySaveDialogProps<T>>
    permissionPrefix: string
    query?: () => TQuery
    workflow?: {
        statusField: keyof T
        transitions: Record<string, string[]>
        statusOrder: string[]
    }
    expandable?: {
        template: (row: T) => React.ReactNode
        allow?: (row: T) => boolean
    }

    importConfig?: {
        enable: boolean;
        importId?: string | undefined;
    }

    toolbarEnd?: React.ReactNode;

    disableEditRow?: (row: T) => boolean;
    disableDeleteRow?: (row: T) => boolean;
}) {

    return function EntityManager() {

        const { hasPermission } = useAuth()
        const confirm = useConfirmDialog()

        const {
            items,
            setAll,
            updateItem,
            removeItem,
            loading,
            setLoading,
            error,
            setError
        } = useCrudList<T>()

        const [item, setItem] = useState<T | null>(null);
        const [showDialog, setShowDialog] = useState(false);
        const [showImportDialog, setShowImportDialog] = useState(false);
        const canCreate = config.createNew && hasPermission([`${config.permissionPrefix}:create`]);
        const canImport = config.importConfig?.enable &&
            hasPermission([`${config.permissionPrefix}:import`]);

        const refresh = async () => {
            const query = config.query ? config.query() : undefined;
            const data = await config.api.getAll(query);
            setAll(data);
        };

        useEffect(() => {
            const fetchData = async () => {
                try {
                    setLoading(true);
                    await refresh();
                    /*
                    const query = config.query ? config.query() : undefined
                    const data = await config.api.getAll(query)
                    setAll(data)*/
                } catch (err: any) {
                    setError(err.message)
                } finally {
                    setLoading(false)
                }
            }
            fetchData();
        }, []);

        const handleCreate = () => {
            if (config.createNew) {
                setItem(config.createNew());
                setShowDialog(true)
            }
        }

        const transitionState = async (
            row: T,
            dto: { current: string; next: string }
        ) => {

            if (!row._id) return;

            const updated = await config.api.transitionState?.(row._id, dto);
            if (updated) {
                updateItem({ ...row, [config.workflow!.statusField]: dto.next });
            }
        };

        const deleteItem = async (row: T) => {
            const ok = await config.api.delete(row)
            if (ok) removeItem(row)
        }

        const defaultActions: RowAction<T>[] = [
            {
                icon: "pi pi-pencil",
                severity: "success",
                permissions: [`${config.permissionPrefix}:update`],
                disabled: config.disableEditRow,
                //visible: config.disableEditRow,
                onClick: (row: T) => {
                    setItem({ ...row })
                    setShowDialog(true)
                }
            },
            {
                icon: "pi pi-trash",
                severity: "danger",
                permissions: [`${config.permissionPrefix}:delete`],
                disabled: config.disableDeleteRow,
                //visible: !!!config.disableDeleteRow,
                onClick: (row: T) =>
                    confirm.ask({
                        item: config.itemName,
                        onConfirmAsync: () => deleteItem(row)
                    })
            }

        ]

        let columns = [...config.columns];

        if (config.workflow) {

            columns.push({
                header: "",
                body: (row: T) => {

                    const current = row[config.workflow!.statusField] as string;

                    return (
                        <StateTransitionButtons
                            id={row._id}
                            current={current}
                            transitions={config.workflow!.transitions}
                            statusOrder={config.workflow!.statusOrder}
                            permissionPrefix={config.permissionPrefix}
                            hasPermission={hasPermission}
                            onTransition={async (next) =>
                                confirm.ask({
                                    operation: `Change to ${next}`,
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

        const toolbarEnd = (
            <>
                {/* existing toolbarEnd from entity */}
                {config.toolbarEnd}

                {/* your import button */}
                {canImport && (
                    <Button
                        label="Import"
                        icon="pi pi-upload"
                        severity="secondary"
                        outlined
                        onClick={() => setShowImportDialog(true)}
                    />
                )}
            </>
        );

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
                    enableSearch
                    hasPermission={hasPermission}
                    actions={defaultActions}
                    onCreate={canCreate ? handleCreate : undefined}
                    expandable={config.expandable}
                    toolbarEnd={toolbarEnd}
                />

                {item && showDialog && config.SaveDialog && (
                    <config.SaveDialog
                        visible={showDialog}
                        item={item}
                        onComplete={(saved: T) => {
                            updateItem(saved)
                            setShowDialog(false)
                        }}
                        onHide={() => setShowDialog(false)}
                    />
                )}

                {showImportDialog && (
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
        )
    }
}
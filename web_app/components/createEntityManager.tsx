import { EntityApi } from "@/api/EntityApi"
import { useAuth } from "@/contexts/auth-context"
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext"
import { useCrudList } from "@/hooks/useCrudList"
import { useState, useEffect } from "react"
import { ItemManager, RowAction } from "./ItemManager"

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
    createNew: () => T
    SaveDialog: React.ComponentType<EntitySaveDialogProps<T>>
    permissionPrefix: string
    query?: () => TQuery
    expandable?: {
        template: (row: T) => React.ReactNode
        allow?: (row: T) => boolean
    }
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

        const [item, setItem] = useState<T | null>(null)
        const [showDialog, setShowDialog] = useState(false)
        const canCreate = hasPermission([`${config.permissionPrefix}:create`]);

        useEffect(() => {
            const fetchData = async () => {
                try {
                    setLoading(true)
                    const query = config.query ? config.query() : undefined
                    const data = await config.api.getAll(query)
                    setAll(data)
                } catch (err: any) {
                    setError(err.message)
                } finally {
                    setLoading(false)
                }
            }

            fetchData()
        }, [])

        const handleCreate = () => {
            setItem(config.createNew())
            setShowDialog(true)
        }

        const deleteItem = async (row: T) => {
            const ok = await config.api.delete(row)
            if (ok) removeItem(row)
        }

        const actions: RowAction<T>[] = [

            {
                icon: "pi pi-pencil",
                severity: "success",
                permissions: [`${config.permissionPrefix}:update`],
                onClick: (row: T) => {
                    setItem({ ...row })
                    setShowDialog(true)
                }
            },

            {
                icon: "pi pi-trash",
                severity: "danger",
                permissions: [`${config.permissionPrefix}:delete`],
                onClick: (row: T) =>
                    confirm.ask({
                        item: config.itemName,
                        onConfirmAsync: () => deleteItem(row)
                    })
            }

        ]

        return (
            <>
                <ItemManager
                    headerTitle={config.title}
                    itemName={config.itemName}
                    items={items}
                    columns={config.columns}
                    dataKey="_id"
                    loading={loading}
                    error={error}
                    enableSearch
                    hasPermission={hasPermission}
                    actions={actions}
                    onCreate={canCreate ? handleCreate : undefined}
                    expandable={config.expandable}
                />

                {item && showDialog && (
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
            </>
        )
    }
}
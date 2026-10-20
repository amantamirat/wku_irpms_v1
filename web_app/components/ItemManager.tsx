'use client';

import React, {
    useCallback,
    useEffect,
    useId,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { PrimeIcons } from "primereact/api";
import { EntityApi, StateTransition } from "@/api/EntityApi";
import {
    ItemDataTable,
    ItemDataTableProps,
    RowActionButton,
    ToolBarActionButton,
} from "@/components/data-table/ItemDataTable";
import { useCrudList } from "@/hooks/useCrudList";
import { useCrudActions } from "@/hooks/useCrudActions";
import {
    TransitionAction,
    TransitionMap,
    useStateTransitionActions,
} from "@/hooks/useStateTransitionActions";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export type ItemManagerOperation = "load" | "create" | "update" | "delete" | "transition";

export type ItemFormMode = "create" | "edit";

/** Imperative handle so the parent can change the list after its own actions. */
export interface ItemManagerHandle<T> {
    addItem: (item: T, options?: { prepend?: boolean }) => void;
    updateItem: (item: T) => void;
    patchItem: (id: string, patch: Partial<T>) => void;
    removeItem: (item: T | string) => void;
    getById: (id: string) => T | undefined;
    reload: () => void;
}

export interface ItemFormRenderProps<T> {
    mode: ItemFormMode;
    /** The row being edited, or null when creating. */
    item: T | null;
    saving: boolean;
    /** Put this id on your <form>. The dialog footer's Save button submits the form with this id. */
    formId: string;
    /** Resolves after the API call; the dialog closes on success and stays open on failure. */
    onSubmit: (data: Partial<T>) => Promise<void>;
    onCancel: () => void;
}

export interface ItemManagerProps<T, Q = undefined> {
    api: EntityApi<T, Q>;
    /** Used for permission keys, e.g. "orders" -> "orders:create". */
    resource: string;
    /** Singular display name, e.g. "Order". */
    itemName: string;
    itemIcon?: string;

    headerTitle?: string;
    dataKey?: keyof T & string;

    columns: ItemDataTableProps<T>["columns"];
    enableColumnToggle?: boolean;
    defaultHiddenFields?: string[];

    /** Passed to api.getAll. Objects are compared by value, so inline literals are fine. */
    filter?: Q;
    /** Set to false to postpone loading (e.g. until a required filter exists). Default true. */
    enabled?: boolean;

    /** Lets the parent add / update / patch / remove rows or trigger a reload. */
    managerRef?: React.Ref<ItemManagerHandle<T>>;

    /** Renders the create/edit form inside the dialog. Omit it to hide Create and Edit. */
    renderForm?: (props: ItemFormRenderProps<T>) => React.ReactNode;
    dialogWidth?: string;
    dialogMaximizable?: boolean;
    dialogMaximized?: boolean;

    /* State transitions (needs api.transitionState) */
    statusField?: keyof T;
    transitions?: TransitionMap;

    /* CRUD action tweaks */
    hideCreateAction?: boolean;
    hideEditAction?: boolean;
    hideDeleteAction?: boolean;
    disableEditRow?: (row: T) => boolean;
    disableDeleteRow?: (row: T) => boolean;

    /* Extension points */
    extraToolbarActions?: ToolBarActionButton[];
    extraRowActions?: RowActionButton<T>[];
    tableProps?: Partial<
        Omit<
            ItemDataTableProps<T>,
            "items" | "columns" | "rowActions" | "toolBarActions" | "loading" | "dataKey"
        >
    >;

    /** Called for every failed API call. Defaults to console.error. */
    onError?: (error: unknown, operation: ItemManagerOperation) => void;

    /**
     * Called after a successful create or update from the form dialog.
     * (Delete and transitions already show a success toast from the confirm dialog.)
     */
    onSuccess?: (operation: "create" | "update", item: T) => void;

    /** Called after an item was deleted and removed from the list. Receives the deleted row. */
    onDeleted?: (item: T) => void;

    /** Called after a state transition succeeded and the list was updated. */
    onTransitioned?: (item: T, transition: StateTransition) => void;

    /**
     * Adjust the API response before it goes into the list, e.g. to keep fields
     * the API doesn't echo back. `submitted` is what the form sent.
     */
    mapSaved?: (saved: T, submitted: Partial<T>) => T;

    /**
     * Same idea for state transitions. `previous` is the row currently in the list
     * (e.g. keep populated relations and only take `status` from the response).
     */
    mapTransitioned?: (updated: T, previous: T | undefined) => T;
}

/** Runs a user callback without letting its errors be mistaken for API failures. */
const safely = (fn: () => void) => {
    try {
        fn();
    } catch (error) {
        console.error("ItemManager callback failed:", error);
    }
};

type FormState<T> =
    | { mode: "create"; item: null }
    | { mode: "edit"; item: T }
    | null;

/* -------------------------------------------------------------------------- */
/*                                ItemManager                                 */
/* -------------------------------------------------------------------------- */

export function ItemManager<T extends Record<string, any>, Q = undefined>({
    api,
    resource,
    itemName,
    itemIcon,
    headerTitle,
    dataKey = "_id" as keyof T & string,

    columns,
    enableColumnToggle,
    defaultHiddenFields,

    filter,
    enabled = true,
    managerRef,

    renderForm,
    dialogWidth = "32rem",
    dialogMaximizable,
    dialogMaximized,

    statusField,
    transitions,

    hideCreateAction,
    hideEditAction,
    hideDeleteAction,
    disableEditRow,
    disableDeleteRow,

    extraToolbarActions,
    extraRowActions,
    tableProps,
    onError,
    onSuccess,
    onDeleted,
    onTransitioned,
    mapSaved,
    mapTransitioned,
}: ItemManagerProps<T, Q>) {
    const confirm = useConfirmDialog();
    const formId = useId();

    const getId = useCallback((row: T) => String(row[dataKey]), [dataKey]);

    const {
        items,
        setAll,
        addItem,
        updateItem,
        removeItem,
        loading,
        withLoading,
    } = useCrudList<T>({ getId });

    // Latest values without re-triggering effects / callbacks
    const itemsRef = useRef(items);
    itemsRef.current = items;
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;
    const onSuccessRef = useRef(onSuccess);
    onSuccessRef.current = onSuccess;
    const onDeletedRef = useRef(onDeleted);
    onDeletedRef.current = onDeleted;
    const onTransitionedRef = useRef(onTransitioned);
    onTransitionedRef.current = onTransitioned;
    const mapSavedRef = useRef(mapSaved);
    mapSavedRef.current = mapSaved;
    const mapTransitionedRef = useRef(mapTransitioned);
    mapTransitionedRef.current = mapTransitioned;
    const filterRef = useRef(filter);
    filterRef.current = filter;

    const reportError = useCallback((error: unknown, operation: ItemManagerOperation) => {
        if (onErrorRef.current) onErrorRef.current(error, operation);
        else console.error(`ItemManager ${operation} failed:`, error);
    }, []);

    const getById = useCallback(
        (id: string) => itemsRef.current.find((row) => getId(row) === id),
        [getId]
    );

    /* ------------------------------- Loading ------------------------------- */

    const filterKey = JSON.stringify(filter ?? null);
    const requestId = useRef(0);
    const [reloadTick, setReloadTick] = useState(0);

    useEffect(() => {
        if (!enabled) return;

        const id = ++requestId.current;

        withLoading(async () => {
            try {
                const data = await api.getAll(filterRef.current);
                // Ignore responses from superseded requests
                if (id === requestId.current) setAll(Array.isArray(data) ? data : []);
            } catch (error) {
                if (id === requestId.current) reportError(error, "load");
            }
        });

        return () => {
            // Invalidate in-flight request on change/unmount
            requestId.current++;
        };
    }, [api, filterKey, enabled, reloadTick, withLoading, setAll, reportError]);

    /* --------------------------- Imperative handle -------------------------- */

    useImperativeHandle(
        managerRef,
        (): ItemManagerHandle<T> => ({
            addItem,
            updateItem,
            patchItem: (id, patch) => {
                const current = getById(id);
                if (current) updateItem({ ...current, ...patch });
            },
            removeItem: (target) => {
                const row = typeof target === "string" ? getById(target) : target;
                if (row) removeItem(row);
            },
            getById,
            reload: () => setReloadTick((t) => t + 1),
        }),
        [addItem, updateItem, removeItem, getById]
    );

    /* ------------------------------ Form dialog ----------------------------- */

    const [form, setForm] = useState<FormState<T>>(null);
    const [saving, setSaving] = useState(false);
    const savingRef = useRef(false);

    const openCreate = useCallback(() => setForm({ mode: "create", item: null }), []);
    const openEdit = useCallback((row: T) => setForm({ mode: "edit", item: row }), []);
    const closeForm = useCallback(() => setForm(null), []);

    const handleSubmit = useCallback(
        async (data: Partial<T>) => {
            if (!form || savingRef.current) return;

            const finalize = (saved: T) =>
                mapSavedRef.current ? mapSavedRef.current(saved, data) : saved;

            savingRef.current = true;
            setSaving(true);
            try {
                if (form.mode === "create") {
                    const created = finalize(await api.create(data));
                    //addItem(created, { prepend: true }); just to use populated
                    addItem({ ...created, ...data }, { prepend: true });
                    safely(() => onSuccessRef.current?.("create", created));
                } else {
                    // update(data) currently takes the id inside the payload
                    const updated = finalize(
                        await api.update({
                            ...data,
                            [dataKey]: getId(form.item),
                        } as Partial<T>)
                    );
                    //updateItem(updated); just to use populated
                    updateItem({ ...updated, ...data });
                    safely(() => onSuccessRef.current?.("update", updated));
                }
                setForm(null);
            } catch (error) {
                reportError(error, form.mode === "create" ? "create" : "update");
            } finally {
                savingRef.current = false;
                setSaving(false);
            }
        },
        [form, api, dataKey, getId, addItem, updateItem, reportError]
    );

    /* -------------------------------- Delete -------------------------------- */

    const handleDelete = useCallback(
        (row: T) => {
            confirm.ask({
                item: itemName,
                onConfirm: async () => {
                    await api.delete(row); // later: api.delete(getId(row))
                    removeItem(row);
                    safely(() => onDeletedRef.current?.(row));
                },
                onError: (error) => reportError(error, "delete"),
            });
        },
        [confirm, itemName, api, removeItem, reportError]
    );

    /* ------------------------------ Transitions ----------------------------- */

    const supportsTransitions = !!api.transitionState;

    const handleTransition = useMemo(() => {
        if (!supportsTransitions) return undefined;

        return (id: string, transition: StateTransition, meta: TransitionAction) => {
            confirm.ask({
                operation: meta.action,
                item: itemName,
                reason: meta.requireReason ? { required: meta.requireReason } : undefined,
                icon: meta.icon,
                severity:meta.severity,
                onConfirm: async ({ reason }) => {
                    const payload: StateTransition = { ...transition, reason };
                    const response = await api.transitionState!(id, payload);
                    const next = mapTransitionedRef.current
                        ? mapTransitionedRef.current(response, getById(id))
                        : response;
                    updateItem(next);
                    safely(() => onTransitionedRef.current?.(next, payload));
                },
                onError: (error) => reportError(error, "transition"),
            });
        };
    }, [supportsTransitions, confirm, itemName, api, updateItem, getById, reportError]);

    /* -------------------------------- Actions ------------------------------- */

    const crud = useCrudActions<T>({
        resource,
        itemName,
        hideCreateAction,
        hideEditAction,
        hideDeleteAction,
        disableEditRow,
        disableDeleteRow,
        onCreate: renderForm ? openCreate : undefined,
        onEdit: renderForm ? openEdit : undefined,
        onDelete: handleDelete,
    });

    const transitionActions = useStateTransitionActions<T>({
        resource,
        statusField,
        transitions,
        onTransition: handleTransition,
        getId,
    });

    const rowActions = useMemo(
        () => [...crud.rowActions, ...transitionActions, ...(extraRowActions ?? [])],
        [crud.rowActions, transitionActions, extraRowActions]
    );

    const toolBarActions = useMemo(
        () => [...crud.toolbarActions, ...(extraToolbarActions ?? [])],
        [crud.toolbarActions, extraToolbarActions]
    );

    /* -------------------------------- Render -------------------------------- */

    return (
        <>
            <ItemDataTable<T>
                {...tableProps}
                headerTitle={headerTitle ?? `${itemName}s`}
                headerIcon={itemIcon}
                items={items}
                dataKey={dataKey}
                columns={columns}
                enableColumnToggle={enableColumnToggle}
                defaultHiddenFields={defaultHiddenFields}
                loading={loading}
                rowActions={rowActions}
                toolBarActions={toolBarActions}
            />

            {renderForm && (
                <Dialog
                    visible={!!form}
                    header={
                        <div className="flex align-items-center gap-3">
                            <div
                                className="flex align-items-center justify-content-center border-round bg-primary text-white"
                                style={{ width: "2rem", height: "2rem", flexShrink: 0 }}
                            >
                                <i className={form?.mode === "edit" ? PrimeIcons.PENCIL : PrimeIcons.PLUS} />
                            </div>
                            <div className="text-xl font-semibold text-900">
                                {`${form?.mode === "edit" ? "Edit" : "Add"} ${itemName}`}
                            </div>
                        </div>
                    }
                    style={{ width: dialogWidth }}
                    modal
                    maximizable={dialogMaximizable}
                    maximized={dialogMaximized}
                    draggable={false}
                    closable={!saving}
                    footer={
                        <div className="flex justify-content-end gap-2">
                            <Button
                                type="button"
                                label="Cancel"
                                icon="pi pi-times"
                                outlined
                                onClick={closeForm}
                                disabled={saving}
                            />
                            <Button
                                type="submit"
                                form={formId}
                                label="Save"
                                icon="pi pi-check"
                                loading={saving}
                            />
                        </div>
                    }
                    onHide={() => {
                        if (!saving) closeForm();
                    }}
                >
                    {form &&
                        renderForm({
                            mode: form.mode,
                            item: form.item,
                            saving,
                            formId,
                            onSubmit: handleSubmit,
                            onCancel: closeForm,
                        })}
                </Dialog>
            )}
        </>
    );
}
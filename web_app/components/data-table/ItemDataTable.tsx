'use client';

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { Column, ColumnProps, ColumnBodyOptions } from "primereact/column";
import { DataTable, DataTableExpandedRows, DataTableFilterMeta, DataTableRowToggleEvent } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { MultiSelect, MultiSelectChangeEvent } from "primereact/multiselect";
import { Toolbar } from "primereact/toolbar";
import EmptyState from "@/components/EmptyState";
import { classNames } from "primereact/utils";

/* -------------------------------------------------------------------------- */
/*                                Action Types                                */
/* -------------------------------------------------------------------------- */

export interface ActionButton {
    icon: string;
    label?: string;
    severity?: "success" | "danger" | "warning" | "info" | "secondary" | "help";
    size?: "small" | "large";
    text?: boolean;
    tooltip?: string;
}

export interface RowActionButton<T> extends ActionButton {
    visible?: (row: T) => boolean;
    disabled?: (row: T) => boolean;
    onClick: (row: T) => void | Promise<void>;
}

export interface ToolBarActionButton extends ActionButton {
    visible?: () => boolean;
    disabled?: () => boolean;
    onClick: () => void | Promise<void>;
}

/* -------------------------------------------------------------------------- */
/*                               Selection Types                              */
/* -------------------------------------------------------------------------- */

type TableSelection<T> = T | T[] | null;

type SelectionChangeEvent<T> = {
    value: TableSelection<T>;
};

/* -------------------------------------------------------------------------- */
/*                               Component Props                              */
/* -------------------------------------------------------------------------- */

export interface ItemDataTableProps<T> {
    headerTitle?: string;
    headerIcon?: string;
    items: T[];
    dataKey?: keyof T & string;
    columns: ColumnProps[];
    loading?: boolean;
    enableSearch?: boolean;
    /** Override which fields the global search looks at. Defaults to every column with a `field`. */
    globalFilterFields?: string[];
    showIndexColumn?: boolean;
    rowActions?: RowActionButton<T>[];
    toolBarActions?: ToolBarActionButton[];
    expandable?: {
        template: (row: T) => React.ReactNode;
        allow?: (row: T) => boolean;
    };
    paginator?: boolean;
    rowsPerPage?: number;
    emptyTitle?: string;
    emptyDescription?: string;
    selectionMode?: "checkbox" | "single" | "multiple";
    selection?: TableSelection<T>;
    onSelectionChange?: (selected: TableSelection<T>) => void;
    enableColumnToggle?: boolean;
    defaultHiddenFields?: string[];
}

/* Stable references so omitted props don't create new arrays every render */
const EMPTY_ARRAY: never[] = [];
const SEARCH_DEBOUNCE_MS = 250;

/* -------------------------------------------------------------------------- */
/*                                ItemDataTable                               */
/* -------------------------------------------------------------------------- */

export function ItemDataTable<T extends Record<string, any>>({
    headerTitle,
    headerIcon,
    items = EMPTY_ARRAY,
    dataKey = "_id" as keyof T & string,
    columns = EMPTY_ARRAY,
    loading = false,
    enableSearch = true,
    globalFilterFields,
    showIndexColumn = true,
    rowActions = EMPTY_ARRAY,
    toolBarActions = EMPTY_ARRAY,
    expandable,
    paginator = true,
    rowsPerPage = 10,
    emptyTitle = "No records found",
    emptyDescription = "There are currently no items available to display.",
    selectionMode,
    selection = null,
    onSelectionChange,
    enableColumnToggle = false,
    defaultHiddenFields = EMPTY_ARRAY,
}: ItemDataTableProps<T>) {

    /* ------------------------------ Search ------------------------------ */

    // Single source of truth for filtering; the input has its own state so typing
    // stays instant while the (potentially expensive) filter is debounced.
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    });
    const [searchInput, setSearchInput] = useState("");

    useEffect(() => {
        const id = setTimeout(() => {
            setFilters((prev) => ({
                ...prev,
                global: { value: searchInput || null, matchMode: FilterMatchMode.CONTAINS },
            }));
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(id);
    }, [searchInput]);

    const searchFields = useMemo(
        () =>
            globalFilterFields ??
            (columns.map((col) => col.field).filter(Boolean) as string[]),
        [globalFilterFields, columns]
    );

    /* ------------------------------ Expansion ----------------------------- */

    const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows | any[]>([]);

    /* ------------------------- Column Visibility -------------------------- */

    // Seeded from defaults and the only source of truth afterwards.
    const [hiddenFields, setHiddenFields] = useState<string[]>(defaultHiddenFields);

    const toggleableColumns = useMemo(() => columns.filter((c) => c.field), [columns]);

    const visibleColumns = useMemo(
        () => columns.filter((c) => !c.field || !hiddenFields.includes(c.field as string)),
        [columns, hiddenFields]
    );

    const selectedToggleColumns = useMemo(
        () => toggleableColumns.filter((c) => !hiddenFields.includes(c.field as string)),
        [toggleableColumns, hiddenFields]
    );

    const onColumnToggle = (event: MultiSelectChangeEvent) => {
        const selected = new Set((event.value as ColumnProps[]).map((c) => c.field));
        setHiddenFields(
            toggleableColumns.filter((c) => !selected.has(c.field)).map((c) => c.field as string)
        );
    };

    /* ----------------------- Pending (in-flight) actions ----------------------- */

    const [pending, setPending] = useState<ReadonlySet<string>>(new Set());

    const runAction = useCallback(async (key: string, fn: () => void | Promise<void>) => {
        let alreadyRunning = false;
        setPending((prev) => {
            if (prev.has(key)) {
                alreadyRunning = true;
                return prev;
            }
            return new Set(prev).add(key);
        });
        if (alreadyRunning) return;

        try {
            await fn();
        } catch (err) {
            console.error("ItemDataTable action failed:", err);
        } finally {
            setPending((prev) => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        }
    }, []);

    /* -------------------------- Top Actions --------------------------- */

    const visibleToolBarActions = useMemo(
        () => toolBarActions.filter((action) => !action.visible || action.visible()),
        [toolBarActions]
    );

    const renderBarActions = () => (
        <div className="flex gap-2 align-items-center">
            {visibleToolBarActions.map((action, idx) => {
                const key = `toolbar:${idx}`;
                return (
                    <Button
                        key={`${idx}-${action.label || action.icon}`}
                        icon={action.icon}
                        label={action.label}
                        severity={action.severity}
                        tooltip={action.tooltip}
                        tooltipOptions={{ position: "bottom" }}
                        aria-label={action.label ?? action.tooltip}
                        text={action.text}
                        size={action.size ?? "small"}
                        loading={pending.has(key)}
                        disabled={action.disabled?.() || pending.has(key)}
                        onClick={() => runAction(key, action.onClick)}
                    />
                );
            })}
        </div>
    );

    /* ----------------------------- Header ----------------------------- */

    const hasControls = enableSearch || (enableColumnToggle && toggleableColumns.length > 0);

    const header =
        !headerTitle && !hasControls ? null : (
            <div className="flex flex-column gap-3 py-1">
                <div className="flex flex-wrap align-items-center justify-content-between gap-3">
                    {/* Left: Title & Icon */}
                    {headerTitle ? (
                        <div className="flex align-items-center gap-2">
                            {headerIcon && <i className={classNames(headerIcon, 'text-xl text-primary')} />}
                            <h5 className="m-0 text-900 font-bold text-xl tracking-tight">
                                {headerTitle}
                            </h5>
                        </div>
                    ) : (
                        <div />
                    )}

                    {/* Right: Search and Column Toggle */}
                    <div className="flex flex-wrap align-items-center gap-2">
                        {enableSearch && (
                            <span className="p-input-icon-left">
                                <i className="pi pi-search" />
                                <InputText
                                    type="search"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="Search..."
                                    aria-label="Search table"
                                    className="p-inputtext-sm w-12rem md:w-16rem"
                                />
                            </span>
                        )}

                        {enableColumnToggle && toggleableColumns.length > 0 && (
                            <MultiSelect
                                value={selectedToggleColumns}
                                options={toggleableColumns}
                                optionLabel="header"
                                dataKey="field"
                                onChange={onColumnToggle}
                                placeholder="Columns"
                                className="p-multiselect-sm w-10rem"
                                maxSelectedLabels={1}
                                selectedItemsLabel="{0} selected"
                            />
                        )}
                    </div>
                </div>
            </div>
        );

    /* -------------------------- Row Actions --------------------------- */

    const actionBody = useCallback(
        (row: T) => {
            const visibleActions = rowActions.filter(
                (action) => !action.visible || action.visible(row)
            );

            if (visibleActions.length === 0) return null;

            const rowId = String(row[dataKey]);

            return (
                <div className="flex gap-1 justify-content-end">
                    {visibleActions.map((action, idx) => {
                        const key = `row:${rowId}:${action.icon}:${idx}`;
                        const isPending = pending.has(key);
                        return (
                            <Button
                                key={key}
                                icon={action.icon}
                                label={action.label}
                                severity={action.severity}
                                tooltip={action.tooltip}
                                tooltipOptions={{ position: "bottom" }}
                                aria-label={action.label ?? action.tooltip}
                                text={action.text ?? true}
                                size={action.size ?? "small"}
                                loading={isPending}
                                disabled={action.disabled?.(row) || isPending}
                                onClick={() => runAction(key, () => action.onClick(row))}
                            />
                        );
                    })}
                </div>
            );
        },
        [rowActions, dataKey, pending, runAction]
    );

    const dtSelectionMode = selectionMode === "checkbox" ? undefined : selectionMode;

    /* ------------------------------ Render ---------------------------- */

    return (
        <div className="card border-none">
            {visibleToolBarActions.length > 0 && (
                <Toolbar className="mb-2" end={renderBarActions()} />
            )}

            <DataTable
                value={items}
                dataKey={dataKey}
                loading={loading}
                paginator={paginator && items.length > 0}
                rows={rowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                header={header}
                filters={filters}
                globalFilterFields={searchFields}
                selection={selection as any}
                onSelectionChange={(event: SelectionChangeEvent<T>) =>
                    onSelectionChange?.(event.value)
                }
                selectionMode={dtSelectionMode as any}
                metaKeySelection={false}
                expandedRows={expandedRows}
                onRowToggle={(event: DataTableRowToggleEvent) =>
                    setExpandedRows(event.data)
                }
                rowExpansionTemplate={(data: T) => expandable?.template(data)}
                emptyMessage={
                    loading ? (
                        " "
                    ) : (
                        <EmptyState title={emptyTitle} description={emptyDescription} />
                    )
                }
                className="p-datatable-sm"
                stripedRows
            >
                {selectionMode === "checkbox" && (
                    <Column
                        selectionMode="multiple"
                        headerStyle={{ width: "3rem" }}
                        exportable={false}
                    />
                )}

                {expandable && (
                    <Column
                        expander={
                            expandable.allow
                                ? (row: T) => expandable.allow!(row)
                                : true
                        }
                        style={{ width: "3rem" }}
                    />
                )}

                {showIndexColumn && (
                    <Column
                        header="#"
                        body={(_: T, options: ColumnBodyOptions) => options.rowIndex + 1}
                        style={{ width: "3.5rem" }}
                    />
                )}

                {visibleColumns.map((col, idx) => (
                    <Column
                        key={(col.field as string) || idx}
                        {...col}
                        sortable={col.sortable ?? !!col.field}
                    />
                ))}

                {rowActions.length > 0 && (
                    <Column
                        body={actionBody}
                        header="Actions"
                        exportable={false}
                        style={{ minWidth: "6rem" }}
                        alignHeader="right"
                    />
                )}
            </DataTable>
        </div>
    );
}

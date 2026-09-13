'use client';

import React, { useCallback, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Column, ColumnProps, ColumnBodyOptions } from "primereact/column";
import { DataTable, DataTableExpandedRows, DataTableRowToggleEvent } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { MultiSelect, MultiSelectChangeEvent } from "primereact/multiselect";
import { Toolbar } from "primereact/toolbar";
import EmptyState from "@/components/EmptyState";
import { ListSkeleton } from "../Skeletons";

/* -------------------------------------------------------------------------- */
/*                                Action Types                                */
/* -------------------------------------------------------------------------- */

export interface ActionButton {
    icon: string;
    label?: string;
    severity?: "success" | "danger" | "warning" | "info" | "secondary" | "help";
    size?: "small" | "large";
    text?: boolean;
    rounded?: boolean;
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
    items: T[];
    dataKey?: string;
    columns: ColumnProps[];
    loading?: boolean;
    enableSearch?: boolean;
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

/* -------------------------------------------------------------------------- */
/*                                ItemDataTable                               */
/* -------------------------------------------------------------------------- */

export function ItemDataTable<T extends Record<string, any>>({
    headerTitle,
    items = [],
    dataKey = "_id",
    columns = [],
    loading = false,
    enableSearch = true,
    showIndexColumn = true,
    rowActions = [],
    toolBarActions = [],
    expandable,
    paginator = true,
    rowsPerPage = 10,
    emptyTitle = "No records found",
    emptyDescription = "There are currently no items available to display.",
    selectionMode,
    selection = null,
    onSelectionChange,
    enableColumnToggle = false,
    defaultHiddenFields = [],
}: ItemDataTableProps<T>) {
    const [globalFilter, setGlobalFilter] = useState("");
    const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows | any[]>([]);

    /* ------------------------- Column Visibility -------------------------- */
    const [unselectedFields, setUnselectedFields] = useState<string[]>([]);

    const visibleColumns = useMemo(() => {
        return columns.filter((col) => {
            const field = col.field as string;
            if (!field) return true;

            if (enableColumnToggle && unselectedFields.length > 0) {
                return !unselectedFields.includes(field);
            }

            return !defaultHiddenFields.includes(field);
        });
    }, [columns, defaultHiddenFields, unselectedFields, enableColumnToggle]);

    const onColumnToggle = (event: MultiSelectChangeEvent) => {
        const selectedCols = event.value as ColumnProps[];
        const selectedFields = selectedCols.map((c) => c.field as string);

        const newUnselected = columns
            .map((c) => c.field as string)
            .filter((field) => field && !selectedFields.includes(field));

        setUnselectedFields(newUnselected);
    };

    /* -------------------------- Top Actions --------------------------- */

    const renderBarActions = () => {
        if (!toolBarActions || toolBarActions.length === 0) return null;

        const visibleActions = toolBarActions.filter(
            (action) => !action.visible || action.visible()
        );

        if (visibleActions.length === 0) return null;

        return (
            <div className="flex gap-2 align-items-center">
                {visibleActions.map((action, idx) => (
                    <Button
                        key={`${idx}-${action.label || action.icon}`}
                        icon={action.icon}
                        label={action.label}
                        severity={action.severity}
                        tooltip={action.tooltip}
                        tooltipOptions={{ position: "bottom" }}
                        rounded={action.rounded}
                        text={action.text}
                        size={action.size ?? "small"}
                        disabled={action.disabled?.()}
                        onClick={() => action.onClick()}
                    />
                ))}
            </div>
        );
    };

    const hasToolBarActions = toolBarActions && toolBarActions.length > 0;

    /* ----------------------------- Header ----------------------------- */

    const header = useMemo(() => {
        const hasControls = enableSearch || (enableColumnToggle && columns.length > 0);

        if (!headerTitle && !hasControls) {
            return null;
        }

        return (
            <div className="flex flex-column gap-3 py-1">
                <div className="flex flex-wrap align-items-center justify-content-between gap-3">
                    {/* Left: Title */}
                    {headerTitle ? (
                        <h5 className="m-0 text-900 font-bold text-xl tracking-tight">
                            {headerTitle}
                        </h5>
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
                                    value={globalFilter}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setGlobalFilter(e.target.value)
                                    }
                                    placeholder="Search..."
                                    className="p-inputtext-sm w-12rem md:w-16rem"
                                />
                            </span>
                        )}

                        {enableColumnToggle && columns.length > 0 && (
                            <MultiSelect
                                value={visibleColumns}
                                options={columns}
                                optionLabel="header"
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
    }, [
        enableSearch,
        enableColumnToggle,
        headerTitle,
        globalFilter,
        visibleColumns,
        columns
    ]);

    /* -------------------------- Row Actions --------------------------- */

    const actionBody = useCallback(
        (row: T) => {
            const visibleActions = rowActions.filter(
                (action) => !action.visible || action.visible(row)
            );

            if (visibleActions.length === 0) return null;

            return (
                <div className="flex gap-1 justify-content-end">
                    {visibleActions.map((action, idx) => (
                        <Button
                            key={`${idx}-${action.icon}`}
                            icon={action.icon}
                            label={action.label}
                            severity={action.severity}
                            tooltip={action.tooltip}
                            tooltipOptions={{ position: "bottom" }}
                            rounded={action.rounded ?? true}
                            text={action.text ?? true}
                            size={action.size ?? "small"}
                            disabled={action.disabled?.(row)}
                            onClick={() => action.onClick(row)}
                        />
                    ))}
                </div>
            );
        },
        [rowActions]
    );

    const dtSelectionMode = selectionMode === "checkbox" ? undefined : selectionMode;

    /* ------------------------------ Render ---------------------------- */

    return (
        <div className="card border-none">
            {hasToolBarActions && (
                <Toolbar className="mb-2" end={renderBarActions()} />
            )}

            {loading ? (
                <ListSkeleton rows={rowsPerPage} />
            ) : (
                <DataTable
                    value={items}
                    dataKey={dataKey}
                    paginator={paginator && items.length > 0}
                    rows={rowsPerPage}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    header={header}
                    globalFilter={globalFilter}
                    globalFilterFields={
                        columns.map((col) => col.field).filter(Boolean) as string[]
                    }
                    selection={selection as any}
                    onSelectionChange={(event: SelectionChangeEvent<T>) =>
                        onSelectionChange?.(event.value)
                    }
                    selectionMode={dtSelectionMode as any}
                    expandedRows={expandedRows}
                    onRowToggle={(event: DataTableRowToggleEvent) =>
                        setExpandedRows(event.data)
                    }
                    rowExpansionTemplate={(data: T) =>
                        expandable?.allow?.(data) !== false
                            ? expandable?.template(data)
                            : null
                    }
                    emptyMessage={
                        <EmptyState
                            title={emptyTitle}
                            description={emptyDescription}
                        />
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
                            expander
                            style={{ width: "3rem" }}
                        />
                    )}

                    {showIndexColumn && (
                        <Column
                            header="#"
                            body={(_: T, options: ColumnBodyOptions) =>
                                options.rowIndex + 1
                            }
                            style={{ width: "3.5rem" }}
                        />
                    )}

                    {visibleColumns.map((col, idx) => (
                        <Column
                            key={(col.field as string) || idx}
                            {...col}
                            sortable={col.sortable ?? true}
                        />
                    ))}

                    {rowActions.length > 0 && (
                        <Column
                            body={actionBody}
                            header="Actions"
                            exportable={false}
                            style={{ minWidth: "6rem" }}
                            alignHeader="center"
                        />
                    )}
                </DataTable>
            )}
        </div>
    );
}
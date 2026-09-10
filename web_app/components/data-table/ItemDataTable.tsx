'use client';

import React, { useCallback, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Column, ColumnProps } from "primereact/column";
import {
    DataTable,
    DataTableExpandedRows,
    DataTableFilterMeta,
} from "primereact/datatable";
import { InputText } from "primereact/inputtext";

import { ActionButton } from "@/hooks/useDefaultActions";
import EmptyState from "@/components/EmptyState";
import { ListSkeleton } from "../Skeletons";

export interface ItemDataTableProps<T> {
    headerTitle?: string;
    itemName?: string;
    items: T[];
    dataKey?: string;
    columns: ColumnProps[];
    loading?: boolean;
    enableSearch?: boolean;
    actions?: ActionButton<T>[];
    expandable?: {
        template: (row: T) => React.ReactNode;
        allow?: (row: T) => boolean;
    };
    paginator?: boolean;
    rowsPerPage?: number;
    emptyTitle?: string;
    emptyDescription?: string;
    onCreate?: () => void; // <-- Added back
}

export function ItemDataTable<T extends Record<string, any>>({
    headerTitle,
    itemName,
    items = [],
    dataKey = "_id",
    columns = [],
    loading = false,
    enableSearch = true,
    actions = [],
    expandable,
    paginator = true,
    rowsPerPage = 10,
    emptyTitle = "No records found",
    emptyDescription = "There are currently no items available to display.",
    onCreate, // <-- Destructured here
}: ItemDataTableProps<T>) {
    const [globalFilter, setGlobalFilter] = useState("");
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: {
            value: null,
            matchMode: "contains",
        },
    });

    const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows | any[]>([]);

    const onGlobalFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFilters((prev) => ({
            ...prev,
            global: {
                ...prev.global,
                value,
            },
        }));
        setGlobalFilter(value);
    }, []);

    const header = useMemo(() => {
        if (!enableSearch && !headerTitle && !onCreate) return null;

        return (
            <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
                {headerTitle ? (
                    <h5 className="m-0 text-900 font-bold text-xl">{headerTitle}</h5>
                ) : (
                    <div />
                )}

                <div className="flex align-items-center gap-2 w-full md:w-auto">
                    {enableSearch && (
                        <span className="p-input-icon-left flex-1 md:flex-initial">
                            <i className="pi pi-search" />
                            <InputText
                                type="search"
                                value={globalFilter}
                                onChange={onGlobalFilterChange}
                                placeholder="Search ..."
                                className="w-full md:w-20rem p-inputtext-sm"
                            />
                        </span>
                    )}

                    {onCreate && (
                        <Button
                            label={`Create ${itemName || ""}`}
                            icon="pi pi-plus"
                            severity="success"
                            size="small"
                            onClick={onCreate}
                        />
                    )}
                </div>
            </div>
        );
    }, [enableSearch, headerTitle, globalFilter, onGlobalFilterChange, onCreate]);

    const actionBody = useCallback(
        (row: T) => {
            const visibleActions = actions.filter(
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
        [actions]
    );

    return (
        <div className="card border-none shadow-1 p-0">
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
                    filters={filters}
                    globalFilterFields={
                        columns
                            .map((col) => col.field)
                            .filter(Boolean) as string[]
                    }
                    expandedRows={expandedRows}
                    onRowToggle={(e) => setExpandedRows(e.data)}
                    rowExpansionTemplate={(row) =>
                        expandable?.allow?.(row) !== false
                            ? expandable?.template(row)
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
                    {expandable && (
                        <Column expander style={{ width: "3rem" }} />
                    )}

                    <Column
                        header="#"
                        body={(_, options) => options.rowIndex + 1}
                        style={{ width: "3.5rem" }}
                    />

                    {columns.map((col, idx) => (
                        <Column
                            key={col.field || idx}
                            {...col}
                            sortable={col.sortable ?? true}
                        />
                    ))}

                    {actions.length > 0 && (
                        <Column
                            body={actionBody}
                            header="Actions"
                            exportable={false}
                            style={{ minWidth: "6rem", textAlign: "right" }}
                        />
                    )}
                </DataTable>
            )}
        </div>
    );
}
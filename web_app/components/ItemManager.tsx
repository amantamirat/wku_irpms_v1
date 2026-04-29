import React, { useState, useMemo, useCallback } from "react";
import { Button } from "primereact/button";
import { Column, ColumnProps } from "primereact/column";
import { DataTable, DataTableFilterMeta, DataTableExpandedRows } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { Toolbar } from "primereact/toolbar";
import ErrorCard from "./ErrorCard";
import ListSkeleton from "./ListSkeleton";

export interface RowAction<T> {
    icon: string;
    severity?: "success" | "danger" | "warning" | "info" | "secondary" | "help";
    tooltip?: string;
    permissions?: string[];
    visible?: (row: T) => boolean;
    disabled?: (row: T) => boolean;
    onClick: (row: T) => void | Promise<void>;
}

interface ItemManagerProps<T> {
    itemName?: string;
    headerTitle?: string;
    items: T[];
    dataKey: string;
    columns: ColumnProps[]; // Replaced 'any' with PrimeReact's own type
    loading?: boolean;
    error?: string | null;
    enableSearch?: boolean;
    actions?: RowAction<T>[];
    hasPermission?: (permissions: string[]) => boolean;
    onCreate?: () => void;
    toolbarEnd?: React.ReactNode;
    expandable?: {
        template: (row: T) => React.ReactNode;
        allow?: (row: T) => boolean;
    };
}

export function ItemManager<T extends Record<string, any>>({
    itemName = "item",
    headerTitle,
    items,
    dataKey,
    columns,
    loading,
    error,
    enableSearch = false,
    actions = [],
    hasPermission,
    onCreate,
    toolbarEnd,
    expandable,
}: ItemManagerProps<T>) {
    const [globalFilter, setGlobalFilter] = useState("");
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: "contains" },
    });
    const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows | any[]>([]);

    // Memoized filter handler to prevent re-renders
    const onGlobalFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFilters((prev) => ({
            ...prev,
            global: { ...prev.global, value },
        }));
        setGlobalFilter(value);
    }, []);

    // Professional Header: Search on the right, Title on the left
    const header = useMemo(() => {
        if (!enableSearch && !headerTitle) return null;
        return (            
            <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
                <h5 className="m-0 text-900">{headerTitle}</h5>
                {enableSearch && (
                    <span className="p-input-icon-left w-full md:w-auto">
                        <i className="pi pi-search" />
                        <InputText
                            type="search"
                            value={globalFilter}
                            onChange={onGlobalFilterChange}
                            placeholder="Search..."
                            className="w-full md:w-20rem"
                        />
                    </span>
                )}
            </div>
        );
    }, [enableSearch, headerTitle, globalFilter, onGlobalFilterChange]);

    const actionBody = useCallback((row: T) => {
        const allowedActions = actions.filter((action) => {
            if (action.visible && !action.visible(row)) return false;
            if (action.permissions && hasPermission && !hasPermission(action.permissions)) return false;
            return true;
        });

        if (allowedActions.length === 0) return null;

        return (
            <div className="flex gap-2">
                {allowedActions.map((action, idx) => (
                    <Button
                        key={`${idx}-${action.icon}`}
                        icon={action.icon}
                        severity={action.severity}
                        tooltip={action.tooltip}
                        tooltipOptions={{ position: 'bottom' }}
                        rounded
                        text // More modern than 'p-button-text'
                        size="small"
                        disabled={action.disabled?.(row)}
                        onClick={() => action.onClick(row)}
                    />
                ))}
            </div>
        );
    }, [actions, hasPermission]);

    if (error) return <ErrorCard errorMessage={error} />;

    const startToolbarTemplate = () => (
        <div className="flex flex-wrap gap-2">
            {onCreate && (
                <Button
                    label={`New ${itemName}`}
                    icon="pi pi-plus"
                    severity="success"
                    onClick={onCreate}
                />
            )}
        </div>
    );

    return (
        <div className="card border-none shadow-2">
            {(onCreate || toolbarEnd) && (
                <Toolbar className="mb-4" start={startToolbarTemplate} end={toolbarEnd} />
            )}

            {loading ? (
                <ListSkeleton rows={8} />
            ) : (
                <DataTable
                    value={items}
                    dataKey={dataKey}
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    header={header}
                    filters={filters}
                    globalFilterFields={columns.map(col => col.field).filter(Boolean) as string[]}
                    expandedRows={expandedRows}
                    onRowToggle={(e) => setExpandedRows(e.data)}
                    rowExpansionTemplate={(row) =>
                        expandable?.allow?.(row) !== false ? expandable?.template(row) : null
                    }
                    emptyMessage={`No ${itemName}s found.`}
                    className="p-datatable-sm"
                    stripedRows
                    breakpoint="960px"
                >
                    {expandable && <Column expander style={{ width: "3rem" }} />}

                    <Column
                        header="#"
                        body={(_, options) => options.rowIndex + 1}
                        style={{ width: "4rem" }}
                    />

                    {columns.map((col, idx) => (
                        <Column key={col.field || idx} {...col} sortable />
                    ))}

                    {actions.length > 0 && (
                        <Column
                            body={actionBody}
                            header="Actions"
                            exportable={false}
                            style={{ minWidth: "8rem", textAlign: 'right' }}
                        />
                    )}
                </DataTable>
            )}
        </div>
    );
}
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import React, { useState } from "react";
import ListSkeleton from "./ListSkeleton";
import ErrorCard from "./ErrorCard";
import { BreadCrumb } from "primereact/breadcrumb";

interface CrudManagerProps<T> {
    itemName?: string;
    headerTitle?: string;
    items: T[];
    dataKey: string;
    columns: any[];
    loading?: boolean;
    error?: string | null;
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    onCreate?: () => void;
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
    extraActions?: (row: T) => React.ReactNode;
    toolbarEnd?: React.ReactNode;
    //toolbarTop?: React.ReactNode;
    rowExpansionTemplate?: (row: T) => React.ReactNode;
    enableSearch?: boolean;
    enableSelection?: boolean;
    selectionMode?: "single" | "multiple";
    selectedItems?: T[] | T | null;
    onSelectionChange?: (value: T[] | T | null) => void;
}

export function CrudManager<T extends { _id?: string }>({
    itemName,
    headerTitle,
    items,
    dataKey,
    columns,
    loading,
    error,
    canCreate,
    canEdit,
    canDelete,
    onCreate,
    onEdit,
    onDelete,
    extraActions,
    toolbarEnd,
    //toolbarTop,
    rowExpansionTemplate,
    enableSearch = false,
    enableSelection = false,
    selectionMode = "single",
    selectedItems,
    onSelectionChange,

}: CrudManagerProps<T>) {

    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>({});


    const handleGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setGlobalFilter(value);
        setFilters({ ...filters, global: { value, matchMode: 'contains' } });
    };


    const home = { icon: 'pi pi-home', url: '/' }
    const renderBreadcrumb = () => {
        return (
            <BreadCrumb home={home} />
        );
    }

    const renderToolbar = () => {
        if ((!canCreate || !onCreate) && !toolbarEnd) return null;
        return (
            <Toolbar
                className="mb-3"
                start={
                    canCreate && onCreate ? (
                        <Button
                            label={`New ${itemName ?? ''}`}
                            icon="pi pi-plus"
                            severity="success"
                            onClick={onCreate}
                        />
                    ) : null
                }
                end={toolbarEnd ?? null}
            />
        );
    };

    const header = enableSearch ? (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">{headerTitle}</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                    type="search"
                    value={globalFilter}
                    onChange={handleGlobalFilterChange}
                    placeholder="Search..."
                    className="w-full md:w-1/3"
                />
            </span>
        </div>
    ) : undefined;

    const actionBody = (row: T) => (
        <div className="flex gap-2">
            {/* ➕ Inject extra actions from parent */}
            {extraActions && extraActions(row)}
            {canEdit && (
                <Button
                    icon="pi pi-pencil"
                    rounded
                    severity="success"
                    className="p-button-text"
                    onClick={() => onEdit?.(row)}
                />
            )}
            {canDelete && (
                <Button
                    icon="pi pi-trash"
                    rounded
                    severity="danger"
                    className="p-button-text"
                    onClick={() => onDelete?.(row)}
                />
            )}
        </div>
    );

    if (loading) return <ListSkeleton rows={10} />;
    if (error) return <ErrorCard errorMessage={error} />;

    return (
        <>
            <div className="card">
                {
                    //renderBreadcrumb()
                }
                {
                    //toolbarTop
                }
                {renderToolbar()}
                <DataTable
                    value={items}
                    dataKey={dataKey}
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25]}
                    scrollable
                    emptyMessage="No data found."
                    expandedRows={rowExpansionTemplate ? expandedRows : undefined}
                    onRowToggle={(e) => setExpandedRows(e.data)}
                    rowExpansionTemplate={rowExpansionTemplate}
                    filters={filters}
                    globalFilter={globalFilter}
                    header={header}

                    selection={enableSelection ? selectedItems : undefined}
                    //selectionMode={enableSelection ? selectionMode : undefined}
                    onSelectionChange={
                        enableSelection
                            ? (e: any) =>
                                onSelectionChange?.(e.value)
                            : undefined
                    }

                >
                    {rowExpansionTemplate && <Column expander style={{ width: "3rem" }} />}

                    {enableSelection && (
                        <Column selectionMode={selectionMode} headerStyle={{ width: "3rem" }} />
                    )}
                    <Column
                        header="#"
                        body={(row, options) => options.rowIndex + 1}
                        style={{ width: "4rem" }}
                    />

                    {columns.map((col, idx) => (
                        <Column key={idx} {...col} />
                    ))}

                    {(canEdit || canDelete) && <Column body={actionBody} />}
                </DataTable>
            </div>
        </>
    );
}

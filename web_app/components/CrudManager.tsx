import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import React, { useState } from "react";

interface CrudManagerProps<T> {
    itemName?: string;
    headerTitle?: string;
    items: T[];
    dataKey: string;
    columns: any[];
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    onCreate?: () => void;
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
    expandedRows?: any[] | DataTableExpandedRows;
    onRowToggle?: (exp: any) => void;
    rowExpansionTemplate?: (row: T) => React.ReactNode;

    /** Optional search filter */
    enableSearch?: boolean;
}

export function CrudManager<T extends { _id?: string }>({
    itemName,
    headerTitle,
    items,
    dataKey,
    columns,
    canCreate,
    canEdit,
    canDelete,
    onCreate,
    onEdit,
    onDelete,
    expandedRows,
    onRowToggle,
    rowExpansionTemplate,
    enableSearch = false
}: CrudManagerProps<T>) {

    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});

    const handleGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setGlobalFilter(value);
        setFilters({ ...filters, global: { value, matchMode: 'contains' } });
    };

    const renderToolbar = () => {
        if (!canCreate || !onCreate) return null;
        return (
            <Toolbar
                className="mb-3"
                start={
                    <Button
                        label={`New ${itemName??''}`}
                        icon="pi pi-plus"
                        severity="success"
                        onClick={onCreate}
                    />
                }
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

    return (
        <div className="card">
            {renderToolbar()}
            <DataTable
                value={items}
                dataKey={dataKey}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25]}
                scrollable
                emptyMessage="No data found."
                expandedRows={expandedRows}
                onRowToggle={onRowToggle}
                rowExpansionTemplate={rowExpansionTemplate}
                filters={filters}
                globalFilter={globalFilter}
                header={header}
            >
                {rowExpansionTemplate && <Column expander style={{ width: "3rem" }} />}

                <Column
                    header="#"
                    body={(row, options) => options.rowIndex + 1}
                    style={{ width: "4rem" }}
                />

                {columns.map((col, idx) => (
                    <Column key={idx} {...col} />
                ))}

                {(canEdit || canDelete) && <Column body={actionBody} header="Actions" />}
            </DataTable>
        </div>
    );
}

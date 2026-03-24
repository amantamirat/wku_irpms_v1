import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTableFilterMeta, DataTable } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { Toolbar } from "primereact/toolbar";
import { useState } from "react";
import ErrorCard from "./ErrorCard";
import ListSkeleton from "./ListSkeleton";
import { FileUpload } from "primereact/fileupload";

export interface RowAction<T> {
    icon: string;
    severity?: "success" | "danger" | "warning" | "info" | "secondary";
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
    columns: any[];

    loading?: boolean;
    error?: string | null;

    enableSearch?: boolean;

    actions?: RowAction<T>[];
    hasPermission?: (permissions: string[]) => boolean;

    onCreate?: () => void;

    expandable?: {
        template: (row: T) => React.ReactNode;
        allow?: (row: T) => boolean;
    };

    onImport?: (data: any[]) => Promise<void>;
}

export function ItemManager<T extends { _id?: string }>({
    itemName,
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
    expandable,
    onImport
}: ItemManagerProps<T>) {

    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [expandedRows, setExpandedRows] = useState<any>(null);

    const handleGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setGlobalFilter(value);
        setFilters({ ...filters, global: { value, matchMode: 'contains' } });
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

    const actionBody = (row: T) => {

        if (!actions.length) return null;

        const allowedActions = actions.filter(action => {

            if (action.visible && !action.visible(row)) return false;

            if (
                action.permissions &&
                hasPermission &&
                !hasPermission(action.permissions)
            ) return false;

            return true;
        });

        if (!allowedActions.length) return null;

        return (
            <div className="flex gap-2">
                {allowedActions.map((action, idx) => (
                    <Button
                        key={idx}
                        icon={action.icon}
                        severity={action.severity}
                        tooltip={action.tooltip}
                        rounded
                        className="p-button-text"
                        disabled={action.disabled?.(row)}
                        onClick={() => action.onClick(row)}
                    />
                ))}
            </div>
        );
    };

    if (error) return <ErrorCard errorMessage={error} />;

    const emptyTemplate = (
        <div className="flex justify-content-center align-items-center py-6">
            <div className="text-center">
                <i className="pi pi-inbox text-4xl text-500 mb-3" />
                <p className="text-500">
                    No {itemName ?? "data"} found at the moment.
                </p>
            </div>
        </div>
    );

    const rowExpansionTemplate = (row: T) => {
        if (!expandable) return null;

        if (expandable.allow && !expandable.allow(row)) {
            return null;
        }

        return expandable.template(row);
    };

    const handleFileSelect = async (event: any) => {
        const file = event.files[0];
        const reader = new FileReader();

        reader.onload = async (e) => {
            const content = e.target?.result as string;
            let parsedData: any[] = [];

            try {
                if (file.type === "application/json" || file.name.endsWith(".json")) {
                    parsedData = JSON.parse(content);
                } else if (file.name.endsWith(".csv")) {
                    // Simple CSV to JSON logic (you can use PapaParse here)
                    const lines = content.split("\n");
                    const headers = lines[0].split(",");
                    parsedData = lines.slice(1).map(line => {
                        const values = line.split(",");
                        return headers.reduce((obj, h, i) => ({ ...obj, [h.trim()]: values[i]?.trim() }), {});
                    });
                }

                if (onImport) await onImport(parsedData);
            } catch (err) {
                console.error("Parsing error", err);
            }
        };

        reader.readAsText(file);
    };

    return (
        <div className="card">

            {(onCreate || onImport) && (
                <Toolbar
                    className="mb-3"
                    start={
                        onCreate && <Button
                            label={`New ${itemName ?? ""}`}
                            icon="pi pi-plus"
                            severity="success"
                            onClick={onCreate}
                        />
                    }
                    end={onImport && (
                        <FileUpload
                            mode="basic"
                            name="file"
                            accept=".json"
                            maxFileSize={1000000} // This can be dynamic from your Setting API
                            chooseLabel="Import"
                            className="p-button-outlined p-button-secondary"
                            customUpload
                            auto
                            uploadHandler={handleFileSelect}
                        />
                    )}
                />
            )}

            {
                loading
                    ? <ListSkeleton rows={10} />
                    : items.length === 0
                        ? emptyTemplate
                        : (
                            <DataTable
                                value={items}
                                dataKey={dataKey}
                                paginator
                                rows={10}
                                rowsPerPageOptions={[5, 10, 25]}
                                scrollable
                                filters={filters}
                                globalFilter={globalFilter}
                                header={header}
                                //style={{ tableLayout: 'fixed' }}

                                expandedRows={expandedRows}
                                onRowToggle={(e) => setExpandedRows(e.data)}
                                rowExpansionTemplate={rowExpansionTemplate}
                            >

                                {expandable && <Column expander style={{ width: "3rem" }} />}
                                <Column
                                    header="#"
                                    body={(row, options) => options.rowIndex + 1}
                                    style={{ width: "4rem" }}
                                />

                                {columns.map((col, idx) => (
                                    <Column key={idx} {...col} />
                                ))}

                                {actions.length > 0 && (
                                    <Column body={actionBody} />
                                )}

                            </DataTable>
                        )
            }

        </div>
    );
}